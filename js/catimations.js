/* global $:false, _:false, Backbone:false, L:false, d3:false, Furball:false, Catbike:false, turf:false */

/**
 * Animations design
 */

$(document).ready(function() {
  // Class to handle animations
  var Catimations = Backbone.View.extend({
    // Container and other props
    el: '.catimations',
    animations: ['bubble', 'face', 'puzzle'],
    assignedPanels: { 0: undefined, 1: undefined, 2: undefined },

    // Start
    initialize: function() {
      // Show container
      $(this.el).show();

      // Some common properties
      this.$messageContainer = this.$('.full-message');
      this.$message = this.$('.full-message-content');

      // Get some template
      this.templates = {
        panel: _.template($('#catimation-panel').html()),
        buses: _.template($('#catimation-other-buses').html())
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
      console.log('======');
      _.each(data.data, function(d) {
        console.log(d.busID + ' | ' + d.routeID + ' | ' + d.minutes);
      });
      console.log('======');

      // Trim the data, as busID's are not actually unique and look to be
      // repeated each day
      data.data = _.first(data.data, 10);

      // Remove any panels that are not available anymore
      _.each(_this.assignedPanels, function(p, pi) {
        if (p && !_.findWhere(data.data, { busID: p.busID})) {
          _this.assignedPanels[pi] = undefined;
        }
      });

      // Go through the buses and assign to panels
      _.each(data.data, function(d) {
        var found = _this.findWhereKey(_this.assignedPanels, { busID: d.busID });
        var available = _.size(_.filter(_this.assignedPanels, function(p, pi) {
          return (p === undefined);
        }));

        // If this bus has been assigned, then update
        if (!_.isUndefined(found)) {
          _this.assignedPanels[found] = _.extend(
            _this.assignedPanels[found],
            _.clone(d)
          );
          _this.assignedPanels[found].newBus = false;
        }
        // Otherwise, if there are available panels, add
        else if (available) {
          _.find(_this.assignedPanels, function(p, pi) {
            if (p === undefined) {
              _this.assignedPanels[pi] = d;
              _this.assignedPanels[pi].newBus = true;
            }
            return (p === undefined);
          });
        }
      });

      // Get the rest of the buses coming
      this.otherBuses = [];
      _.each(data.data, function(d) {
        if (!_.findWhere(_this.assignedPanels, { busID: d.busID })) {
          _this.otherBuses.push(_.clone(d));
        }
      });

      // Render panels
      this.render();
    },

    // Render/update panels
    render: function() {
      var _this = this;
      var panels = this.assignedPanels;

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
      panels = _.each(panels, function(panel, i) {
        var p = panels[i];
        p.oldFrame = p.frame;
        p.frame = Math.max(1, Math.min(6, Math.ceil(p.minutes / 2)));
        p.frame = 7 - p.frame;

        // Is frame changing
        p.frameChange = (p.oldFrame !== p.frame);

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
        var id = '.panel-' + (parseInt(i, 10) + 1);
        var selector = (p.frameChange) ? id + ' .panel-middle' : '';
        selector += (p.newBus) ? ', ' + id + ' .panel-bottom' : '';

        // Hacky animations
        if (selector && _this.$(selector).length) {
          _this.$(selector).fadeOut('slow', function() {
            _this.$(id).html(_this.templates.panel({ d: p }));

            _this.$(selector).fadeIn('slow');
          });
        }
        else {
          _this.$(id).html(_this.templates.panel({ d: p }));

          if (selector) {
            _this.$(selector).fadeIn('slow');
          }
        }
      });

      // Render other buses
      this.$('.other-buses').html(this.templates.buses({ d: this.otherBuses }));
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

    // Find key
    findWhereKey: function(searchable, findable) {
      var found;
      var find = _.matcher(findable);

      _.find(searchable, function(s, si) {
        if (find(s)) {
          found = si;
          return true;
        }

        return false;
      });

      return found;
    }
  });

  var catimations = new Catimations({});
});
