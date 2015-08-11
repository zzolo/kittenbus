/* global $:false, _:false, Backbone:false, L:false, d3:false, moment:false, turf:false */

/**
 * Addes a moveTo function to Leaflet markers.
 */

(function() {
  var noop = function() {
    // No action
  };

  L.Marker.prototype.moveTo = function(destination, line, duration, done) {
    var _this = this;
    duration = duration || 500;
    destination = (_.isArray(destination)) ? L.latLng(destination) : destination;
    done = done || noop;
    var current = _.clone(this.getLatLng());

    // Make sure we have a destination
    if (!destination.lat) {
      done(this);
      return;
    }

    // Make sure we have a point
    if (!current.lat) {
      done(this);
      return;
    }

    // Use CSS3 to animate when new coordinates set
    if (L.DomUtil.TRANSITION) {
      if (this._icon) {
        this._icon.style[L.DomUtil.TRANSITION] = ('all ' + duration + 'ms linear');
      }

      if (this._shadow) {
        this._shadow.style[L.DomUtil.TRANSITION] = 'all ' + duration + 'ms linear';
      }
    }

    // Set new coordinates
    this.setLatLng(destination);

    // Make a callback
    window.setTimeout(function() {
      done(this);
    }, duration);
  };
})();
