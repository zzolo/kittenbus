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
    stopColors: {
      // Keep in line with CSS
      4: '#0CBCBC',
      6: '#2053C8',
      12: '#FFAF10',
      61: '#FF7C10',
      141: 'transparent',
      698: 'transparent'
    },
    stopOrder: {
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

    // Constructor
    initialize: function() {
      // Some common properties
      this.$messageContainer = this.$('.full-message');
      this.$message = this.$('.full-message-content');
      this.$mapContainer = this.$('.map-container');

      // Get some template
      this.templates = {
        timesItem: _.template($('#times-item-template').html())
      };

      // Create new furball
      this.furball = new Furball();

      // Handle events from furball
      this.furball.on('data', _.bind(this.fullballData, this));

      // If we don't have data from furball in a while, then
      // we shouldn't display antyhing
      this.furball.on('timeout', _.bind(function(error) {
        this.setMessage('We have been unable to get up-to-date information about the bus.  Hopefully this issue will be resolved soon.');
      }, this));

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

      // Start fullball
      this.furball.start();

      // Draw map
      this.renderMap();

      // Remove default loading message
      this.removeMessage();
    },

    // Darw map
    renderMap: function() {
      var _this = this;
      var adjustedRoutes = _.clone(this.data.routes);
      var lineCount = 0;
      var lineFound;

      // Make map
      this.map = L.map('map-container', {
        attributionControl: false,
        zoomControl: false,
        scrollWheelZoom: false
      });

      // Add base map
      L.tileLayer('http://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.jpg', { })
        .addTo(this.map);

      // Set view
      this.map.setView(this.stopLocation, 16);

      // Offset a bit
      this.map.panBy([this.width / 4, 0]);

      // Add point for stop
      this.stopMarker = L.marker(this.stopLocation).addTo(this.map);

      // Sort routes for rendering
      adjustedRoutes.features = _.sortBy(adjustedRoutes.features, function(r) {
        return _this.stopOrder[r.properties.line_id];
      });

      // Offset routes for visual affect
      adjustedRoutes.features = _.map(adjustedRoutes.features, function(r) {
        var line = r.properties.line_id;
        if (line !== lineFound) {
          lineCount++;
        }

        lineFound = line;
        return _this.adjustMapFeature(r, lineCount - 3);
      });

      // Add routes
      this.mapRoutes = L.geoJson(this.data.routes, {
        style: function(feature) {
          var style = _.clone(_this.routeStyle);
          style.color = _this.stopColors[feature.properties.line_id];
          return style;
        }
      }).addTo(this.map);
    },

    // Handle furball stop data
    fullballData: function(data) {
      // If we have data, then all should be up and running
      this.removeMessage();

      // Update times
      this.renderTimes(_.clone(data.data));
    },

    // Render time listing
    renderTimes: function(data) {
      var _this = this;

      // Join data.  Only get one bus per time
      var times = d3.select('.times').selectAll('.time-value')
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
        .classed('time-value', true);

      // Enter and update
      times
        .html(function(d) {
          return _this.templates.timesItem({ d: d });
        });

      // Remove
      times.exit().remove();
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
