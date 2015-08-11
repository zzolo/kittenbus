/* global $:false, _:false, Backbone:false, L:false, d3:false, Furball:false, Catbike:false, turf:false */

/**
 * Animations design
 */

$(document).ready(function() {
  // Class to handle animations
  var Catimations = Backbone.View.extend({
    // Container and other props
    el: '.catimations',
    animations: ['bubble', 'puzzle', 'face'],
    assignedPanels: {},

    // Start
    initialize: function() {
      // Show container
      $(this.el).show();

      // Some common properties
      this.$messageContainer = this.$('.full-message');
      this.$message = this.$('.full-message-content');

      // Get some template
      this.templates = {
        panel: _.template($('#catimation-panel').html())
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

      // Start data collections
      this.furball.start();

      // Remove loading message
      this.removeMessage();
    },

    // Handle furball (bus) data
    furballData: function(data) {
      var _this = this;
      console.log(data);

      // Go through the buses and assign to panels
      _.each(data.data, function(d) {
        // If we don't have enough assigned panels and this bus has not
        // been assigned
        if (_.size(_this.assignedPanels) < 3 && !_this.assignedPanels[d.busID]) {
          console.log(d.minutes);
          _this.assignedPanels[d.busID] = _.clone(d);
        }
        else if (_this.assignedPanels[d.busID]) {
          _this.assignedPanels[d.busID] = _.clone(d);
        }
      });

      // Render panels
      this.render();
    },

    // Render/update panels
    render: function() {
      var _this = this;
      var panels = _.map(this.assignedPanels, _.clone);

      // Determine image to show
      panels = _.map(panels, function(p, i) {
        console.log(p.minutes);
        p.frame = Math.min(6, Math.ceil(p.minutes / 3));
        p.frameImage = 'images/animations/' + _this.animations[i] + '/' +
          _this.animations[i] + '-' + p.frame + '.png';

        return p;
      });

      console.log(panels);
      // Render each panel
      _.each(panels, function(p, i) {
        _this.$('.panel-' + (i + 1)).html(_this.templates.panel({ d: p }));
      });
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
  });

  var catimations = new Catimations({});
});
