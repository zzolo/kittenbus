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

      // Debug
      _.each(data.data, function(d) {
        console.log(d.busID + ' | ' + d.routeID + ' | ' + d.minutes);
      });

      // Trim the data, as busID's are not actually unique
      data.data = _.first(data.data, 8);

      // Remove any unused ones
      _.each(_this.assignedPanels, function(p, pi) {
        if (!_.findWhere(data.data, { busID: p.busID})) {
          delete _this.assignedPanels[pi];
        }
      });

      // Go through the buses and assign to panels
      _.each(data.data, function(d) {
        // If we don't have enough assigned panels and this bus has not
        // been assigned, otherwise update.
        if (_.size(_this.assignedPanels) < 3 && !_this.assignedPanels[d.busID]) {
          _this.assignedPanels[d.busID] = _.clone(d);
        }
        else if (_this.assignedPanels[d.busID]) {
          _this.assignedPanels[d.busID] = _.extend(_.clone(d), {
            animation: _this.assignedPanels[d.busID].animation
          });
        }
      });

      // Render panels
      this.render();
    },

    // Render/update panels
    render: function() {
      var _this = this;
      var panels = this.assignedPanels;
      panels = _.sortBy(panels, 'minutes');

      // Determine the animation to use
      _.each(panels, function(p, pi) {
        if (!p.animation) {
          // Check animations
          _.each(_this.animations, function(a, ai) {
            if (!_.findWhere(panels, { animation: ai })) {
              panels[pi].animation = ai;
            }
          });
        }
      });

      // Determine image to show
      panels = _.map(panels, function(p, i) {
        p.frame = Math.max(1, Math.min(6, Math.ceil(p.minutes / 3)));
        p.frame = 7 - p.frame;

        // Get image frame
        p.frameImage = 'images/animations/' + _this.animations[p.animation] + '/' +
          _this.animations[p.animation] + '-' + p.frame + '.gif';

        // Make shorter name
        p.shortDesc = p.Description.replace(/\/\s+Via/gi, 'via');
        p.shortDesc = (p.shortDesc.length >= 22) ?
          p.shortDesc.substring(0, 22 - 3) + '...' : p.shortDesc;

        return p;
      });

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
