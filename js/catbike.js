/**
 * Nice ride data collector.
 *
 * Nice ride does not have a public API, so we proxy the JSON with
 * https://github.com/MinnPost/jsonproxy
 *
 * https://catbike.herokuapp.com/
 */

(function(w) {

  var Catbike = function(options) {
    this.options = _.extend({}, {
      interval: 60000,
      stationsURL: 'https://secure.niceridemn.org/data2/stations.json',
      proxyURL: 'https://catbike.herokuapp.com/proxy?callback=?&url=[[[URL]]]',
      timeout: 10
    }, options || {});
  };

  // Add events and other methods
  _.extend(Catbike.prototype, Backbone.Events, {
    // Start interval and do right away
    start: function() {
      this.intervalID = w.setInterval(_.bind(this.request, this), this.options.interval);
      this.request();

      // Start timeout check
      this.timeoutReset();
    },

    // Stop polling
    stop: function() {
      if (this.intervalID) {
        w.clearInterval(this.intervalID);
      }

      if (this.timeoutID) {
        w.clearInterval(this.timeoutID);
      }
    },

    // Make request
    request: function() {
      var _this = this;
      var url = this.options.proxyURL.replace('[[[URL]]]', this.options.stationsURL);

      $.ajax({
        url: url,
        type: 'GET',
        dataType: 'jsonp',
        success: function(data) {
          // Restart timeout check
          _this.timeoutReset();

          // Send data
          _this.trigger('data', _this.parse(data));
        },

        error: function() {
          _this.trigger('error', arguments);
        }
      });
    },

    // Parse data
    parse: function(data) {
      data.stations = _.sortBy(_.map(data.stations, function(d) {
        return d;
      }),

      // Sort by time
      function(d) {
        return d.id;
      });

      return data;
    },

    // Timeout reached
    timeoutReached: function() {
      this.timeoutError = true;
      this.trigger('timeout');
    },

    // Timeout reset.
    timeoutReset: function() {
      this.timeoutError = false;

      if (this.timeoutID) {
        w.clearInterval(this.timeoutID);
      }

      this.timeoutID = w.setTimeout(_.bind(this.timeoutReached, this), this.options.timeout * 60 * 1000);
    }
  });

  // Add to window
  w.Catbike = Catbike;
})(window);
