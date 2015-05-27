/**
 * Main JS
 */

$(document).ready(function() {
  // Class to handle kittenbus
  var Kittenbus = Backbone.View.extend({
    // Container and other props
    el: '.kittenbus',
    data: {},
    stopLocation: [44.97770, -93.27499],
    lineColors: {
      // Keep in line with CSS
      4: '#0CBCBC',
      6: '#2053C8',
      12: '#FFAF10',
      61: '#FF7C10',
      141: 'transparent',
      698: 'transparent'
    },
    lineOrder: {
      4: 1,
      6: 2,
      12: 4,
      61: 3,
      141: 5,
      698: 6
    },
    routeStyle: {
      radius: 2,
      fillColor: 'transparent',
      color: 'transparent',
      weight: 3,
      opacity: 0.7,
      fillOpacity: 0.7
    },
    starIcon: L.icon({
      iconUrl: 'images/star.svg',
      iconSize: [30, 30],
      shadowSize: [0, 0],
      iconAnchor: [15, 15],
      shadowAnchor: [0, 0],
      popupAnchor: [0, -15]
    }),
    bikeStationStyle: {
      radius: 5,
      fillColor: '#49DB00',
      color: '#49DB00',
      weight: 0,
      opacity: 0.9,
      fillOpacity: 0.9
    },

    // Constructor
    initialize: function() {
      // Some common properties
      this.$messageContainer = this.$('.full-message');
      this.$message = this.$('.full-message-content');
      this.$mapContainer = this.$('.map-container');

      // Get some template
      this.templates = {
        timesItem: _.template($('#times-item-template').html()),
        bikesItem: _.template($('#bikes-item-template').html())
      };

      // Create new furball
      this.furball = new Furball();

      // Handle events from furball
      this.furball.on('data', _.bind(this.furballData, this));

      // If we don't have data from furball in a while, then
      // we shouldn't display antyhing
      this.furball.on('timeout', _.bind(function(error) {
        this.setMessage('We have been unable to get up-to-date information about the bus.  Hopefully this issue will be resolved soon.');
      }, this));

      // Create new cat bike (Nice Ride)
      this.catbike = new Catbike();

      // Handle catbike data
      this.catbike.on('data', _.bind(this.catbikeData, this));

      // Get data
      this.getData();
      this.on('data', _.bind(this.render, this));
    },

    // Initial render sequence
    render: function(data) {
      // Attach data
      this.data.routes = data.routes;

      // Get some mesaurements
      this.width = $(window).width();
      this.height = $(window).height();

      // Start data providers
      this.furball.start();
      this.catbike.start();

      // Draw map
      this.renderMap();

      // Remove default loading message
      this.removeMessage();
    },

    // Handle furball stop data
    furballData: function(data) {
      // If we have data, then all should be up and running
      this.removeMessage();

      // Update times
      this.renderTimes(_.clone(data.data));

      // Render bus markers
      this.renderBuses(_.clone(data.data));
    },

    // Handle incoming data from catbike
    catbikeData: function(data) {
      this.renderBikes(data.stations);
    },

    // Darw map
    renderMap: function() {
      var _this = this;
      var lineCount = 0;
      var lineFound;

      // Only draw once
      if (this.map) {
        return;
      }

      // Make map
      this.map = L.map('map-container', {
        attributionControl: false,
        zoomControl: false
        //scrollWheelZoom: false
      });

      // Add base map
      L.tileLayer('http://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.jpg', { })
        .addTo(this.map);

      // Set view
      this.map.setView(this.stopLocation, 16);

      // Offset a bit
      this.map.panBy([this.width / 4, 0]);

      // Add point for stop
      this.stopMarker = L.marker(this.stopLocation, {
        icon: this.starIcon
      }).addTo(this.map);

      // Sort routes for rendering
      this.data.adjustedRoutes = _.clone(this.data.routes);
      this.data.adjustedRoutes.features = _.sortBy(this.data.adjustedRoutes.features, function(r) {
        return _this.lineOrder[r.properties.line_id];
      });

      // Offset routes for visual affect
      this.data.adjustedRoutes.features = _.map(this.data.adjustedRoutes.features, function(r) {
        var line = r.properties.line_id;
        if (line !== lineFound) {
          lineCount++;
        }

        lineFound = line;
        return _this.adjustMapFeature(r, lineCount - 3);
      });

      // Add lookup for routes by busID (route and terminal)
      this.routeLookup = {};
      _.each(this.data.adjustedRoutes.features, function(r) {
        var busID = '' + r.properties.line_id +
          ((r.properties.term_lette) ? r.properties.term_lette : '');
        _this.routeLookup[busID] = r;
      });

      // Add routes
      this.mapRoutes = L.geoJson(this.data.adjustedRoutes, {
        style: function(feature) {
          var style = _.clone(_this.routeStyle);
          style.color = _this.lineColors[feature.properties.line_id];
          return style;
        }
      }).addTo(this.map);

      // Make icons for bus
      this.lineMarkers = {};
      _.each(this.lineColors, function(c, ci) {
        _this.lineMarkers[ci] = L.MakiMarkers.icon({
          icon: 'bus',
          color: 'c',
          size: 'm'
        });
      });
    },

    // Render time listing
    renderTimes: function(data) {
      var _this = this;

      // Join data.  Only get one bus per time
      var times = d3.select('.times').selectAll('.row')
        .data(data, function(d, di) {
          return d.busID;
        })
        .sort(function(a, b) {
          return a.time - b.time;
        });

      // Update
      times
        .classed('updated', true);

      // Add new times
      times.enter().append('div')
        .classed('row', true);

      // Enter and update
      times
        .html(function(d) {
          return _this.templates.timesItem({ d: d });
        });

      // Remove
      times.exit().remove();
    },

    // Render markers on map
    renderBuses: function(data) {
      var _this = this;
      this.busMarkers = this.busMarkers || {};

      // Mark all as not found
      _.each(this.busMarkers, function(m, mi) {
        _this.busMarkers[mi].found = false;
      });

      _.each(data, function(b) {
        var busLatLng;
        var busTurf;

        if (b.VehicleLatitude && b.VehicleLongitude) {
          // Snap to route (TODO: GET WORKING)
          busLatLng = [b.VehicleLatitude, b.VehicleLongitude];
          busTurf = turf.scratchPost(
            _this.routeLookup[b.busID],
            turf.point(busLatLng.reverse())
          );

          // Check if exists
          if (!_this.busMarkers[b.BlockNumber]) {
            _this.busMarkers[b.BlockNumber] = {
              id: b.BlockNumber,
              found: true,
              location: [b.VehicleLatitude, b.VehicleLongitude],
              marker: L.marker([b.VehicleLatitude, b.VehicleLongitude], {
                icon: _this.lineMarkers[b.Route]
              })
                .bindPopup(_this.debugOutputHTML(b))
                .addTo(_this.map)
            };
          }
          else {
            _this.busMarkers[b.BlockNumber].found = true;

            // Move marker
            _this.busMarkers[b.BlockNumber].marker.moveTo([b.VehicleLatitude, b.VehicleLongitude], null, 29000);

            // Set new location
            _this.busMarkers[b.BlockNumber].location = [b.VehicleLatitude, b.VehicleLongitude];
          }
        }
      });
    },

    // Render bikes
    renderBikes: function(stations) {
      var _this = this;
      var stopPoint = turf.point(_.clone(_this.stopLocation).reverse());
      var listed;

      // Make sure map is available
      this.renderMap();

      // Draw stations if not done
      if (!this.bikeStations) {
        this.bikeStations = [];

        // Add default markers
        _.each(stations, function(s) {
          _this.bikeStations.push({
            id: s.id,
            data: s,
            marker: L.circleMarker([s.la, s.lo], _this.bikeStationStyle)
              .bindPopup(_this.debugOutputHTML(s))
              .addTo(_this.map),
            distance: turf.distance(
              stopPoint,
              turf.point([s.la, s.lo].reverse())
            )
          });
        });

        // The closest 4 get some special TODO
        this.bikeStations = _.sortBy(this.bikeStations, function(b) {
          return b.distance;
        });
      }

      // Update listing
      listed = d3.select('.bikes').selectAll('.row')
        .data(_.first(this.bikeStations, 4), function(d, di) {
          return d.id;
        })
        .sort(function(a, b) {
          return a.distance - b.distance;
        });

      // Update
      listed
        .classed('updated', true);

      // Add new times
      listed.enter().append('div')
        .classed('row', true);

      // Enter and update
      listed
        .html(function(d) {
          return _this.templates.bikesItem({ d: d });
        });

      // Remove
      listed.exit().remove();
    },

    // Set a message
    setMessage: function(message) {
      this.$message.html(message);
      this.$messageContainer.fadeIn('fast');
    },

    // Remove message
    removeMessage: function() {
      this.$messageContainer.fadeOut('fast');
    },

    // Adjust a geojon feature slightly for visual affect
    adjustMapFeature: function(feature, multiplier) {
      multiplier = multiplier || 0;

      // Adjustment in lon, lat
      var adjustment = [0 * multiplier, 0.00005 * multiplier];

      var adjust = function(input) {
        input[0] += adjustment[0];
        input[1] += adjustment[1];
        return input;
      };

      // Only adjust if needed
      if (adjustment) {
        feature.geometry.coordinates = _.map(feature.geometry.coordinates, function(c, ci) {
          if (_.isArray(c) && _.isNumber(c[0])) {
            c = adjust(c);
          }
          else if (_.isArray(c)) {
            c = _.map(c, adjust);
          }

          return c;
        });
      }

      return feature;
    },

    // Helpful output
    debugOutputHTML: function(data) {
      return '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
    },

    // Get data
    getData: function() {
      var _this = this;

      // Routes
      $.ajax({
        url: 'data/build/routes.geo.json',
        type: 'GET',
        dataType: 'json',
        success: function(routes) {

          _this.trigger('data', {
            routes: routes
          });
        },

        error: function() {
          _this.trigger('error', arguments);
        }
      });
    }
  });

  // Create instance
  var kittenbus = new Kittenbus({});
});
