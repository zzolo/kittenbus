/**
 * Main JS
 */

$(document).ready(function() {
  // Class to handle kittenbus
  var Kittenbus = Backbone.View.extend({
    // Container and other props
    el: '.kittenbus',
    data: {},

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
      this.data.map = data.map;
      this.data.routes = data.routes;

      // Import map
      this.$mapContainer.append(this.data.map.documentElement);

      // Start fullball
      this.furball.start();

      // Remove default loading message
      this.removeMessage();
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

    // Get data
    getData: function() {
      var _this = this;

      // Routes
      $.ajax({
        url: 'data/build/routes.geo.json',
        type: 'GET',
        dataType: 'json',
        success: function(routes) {

          // Map
          $.ajax({
            url: 'images/system-map.svg',
            type: 'GET',
            dataType: 'xml',
            success: function(map) {
              _this.trigger('data', {
                map: map,
                routes: routes
              });
            },

            error: function() {
              _this.trigger('error', arguments);
            }
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
