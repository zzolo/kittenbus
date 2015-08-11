/* global $:false, _:false, Backbone:false, L:false, d3:false, moment:false, turf:false */

/**
 * Metrotransit data collector.
 */

(function(w) {

  var Furball = function(options) {
    this.options = _.extend({}, {
      interval: 30000,
      stop: '17946',
      stopURL: 'http://svc.metrotransit.org/NexTrip/[[[BUSSTOP]]]?format=json&callback=?',
      timeout: 2
    }, options || {});
  };

  // Add events and other methods
  _.extend(Furball.prototype, Backbone.Events, {
    // No data counter
    noDataCount: 0,

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
      var stop = this.options.stop;
      var url = this.options.stopURL.replace('[[[BUSSTOP]]]', stop);

      $.ajax({
        url: url,
        type: 'GET',
        dataType: 'jsonp',
        success: function(data) {
          // Restart timeout check
          _this.timeoutReset();

          // Send data
          _this.trigger('data', {
            error: _this.noDataError(data),
            stop: stop,
            data: _this.parse(data)
          });
        },

        error: function() {
          _this.trigger('error', arguments);
        }
      });
    },

    // Parse data
    parse: function(data) {
      return _.sortBy(_.map(data, function(d) {
        var t = d.DepartureTime;

        // Parse actual time to arrival
        t = t.replace('/Date(', '').replace(')/', '').split('-');
        d.time = moment.unix(parseInt(t[0], 10) / 1000);

        // Get time difference.  Use floor so that we are little safer with
        // our times.
        d.seconds = d.time.diff(moment(), 'seconds');
        d.minutes = Math.floor(d.seconds / 60);

        // Create a route ID
        d.routeID = d.Route + d.Terminal;

        // Create a bus ID
        d.busID = d.BlockNumber + '-' + d.routeID;

        // Make the description a bit more readable
        d.Description = d.Description.replace(/\//ig, ' / ');

        return d;
      }),

      // Sort by time
      function(d) {
        return d.time.unix();
      });
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
    },

    // If there is no data, raise error the first couple times it happens as its
    // probably just a bad feed, but if its more, then its just no buses
    noDataError: function(data) {
      var hasData = (_.isArray(data) && data.length > 0);

      // If valid, then just reset the noData count
      if (hasData) {
        this.noDataCount = 0;
        return false;
      }
      else {
        this.noDataCount++;

        // If not valid and this is the first or second time,
        // then we want to ignore
        if (this.noDataCount <= 2) {
          return true;
        }
        else {
          return false;
        }
      }
    }
  });

  // Add to window
  w.Furball = Furball;
})(window);
