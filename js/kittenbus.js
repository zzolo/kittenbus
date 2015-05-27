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
    bikeIcon: L.icon({
      iconUrl: 'images/bicycle-default-maki.svg',
      iconSize: [35, 35],
      shadowSize: [0, 0],
      iconAnchor: [18, 18],
      shadowAnchor: [0, 0],
      popupAnchor: [0, -18]
    }),

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

      // Only get certain data for next 30 minutes
      var recent = _.filter(_.clone(data.data), function(d) {
        return (d.minutes <= 30);
      });

      // Update times
      this.renderTimes(recent);

      // Render bus markers
      this.renderBuses(recent);
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

      // Add lookup for routes by routeID (route and terminal)
      this.routeLookup = {};
      _.each(this.data.adjustedRoutes.features, function(r) {
        var routeID = '' + r.properties.line_id +
          ((r.properties.term_lette) ? r.properties.term_lette : '');
        _this.routeLookup[routeID] = r;
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
          color: c,
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
          return d.BlockNumber;
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
        var tempMarkers;

        if (b.VehicleLatitude && b.VehicleLongitude) {
          // Snap to route (TODO: GET WORKING)
          /*
          busLatLng = [b.VehicleLatitude, b.VehicleLongitude];
          busTurf = turf.scratchPost(
            _this.routeLookup[b.routeID],
            turf.point(busLatLng.reverse())
          );
          */

          // Check if exists
          if (!_this.busMarkers[b.busID]) {
            _this.busMarkers[b.busID] = {
              id: b.busID,
              found: true,
              marker: L.marker([b.VehicleLatitude, b.VehicleLongitude], {
                icon: _this.lineMarkers[b.Route]
              })
                .bindPopup(_this.debugOutputHTML(b))
                .addTo(_this.map)
            };
          }
          else {
            _this.busMarkers[b.busID].found = true;

            // Move marker.
            _this.busMarkers[b.busID].marker.setLatLng([b.VehicleLatitude, b.VehicleLongitude]);
          }
        }
      });

      // Remove ones that are not there anymore
      tempMarkers = _.clone(this.busMarkers)
      _.each(tempMarkers, function(m, mi) {
        if (!m.found) {
          _this.map.removeLayer(_this.busMarkers[mi].marker);
          delete _this.busMarkers[mi];
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

        // Determine distance and sort
        stations = _.map(stations, function(s) {
          s.distance = turf.distance(
            stopPoint,
            turf.point([s.la, s.lo].reverse())
          );

          return s;
        });

        stations = _.sortBy(stations, function(s) {
          return s.distance;
        });

        // Only use the top few stops
        this.bikeStations = _.map(_.first(stations, 4), function(s) {
          var station = {
            id: s.id,
            data: s,
            marker: L.marker([s.la, s.lo], {
              icon: _this.bikeIcon
            })
              .bindPopup(_this.debugOutputHTML(s))
              .addTo(_this.map),
            distance: s.distance
          };

          return station;
        });
      }

      // Update listing
      listed = d3.select('.bikes').selectAll('.row')
        .data(this.bikeStations, function(d, di) {
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
