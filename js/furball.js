/**
 * Metrotransit data collector.
 */

(function(w) {

  var Furball = function(options) {
    this.options = _.extend({}, {
      interval: 30000,
      stop: '17946',
      stopURL: 'http://svc.metrotransit.org/NexTrip/[[[BUSSTOP]]]?format=json&callback=?'
    }, options || {});
  };

  // Add events and other methods
  _.extend(Furball.prototype, Backbone.Events, {
    // Start interval and do right away
    start: function() {
      this.intervalID = w.setInterval(_.bind(this.request, this), this.options.interval);
      this.request();
    },

    // Stop polling
    stop: function() {
      if (this.intervalID) {
        w.clearInterval(this.intervalID);
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
          _this.trigger('stop', {
            stop: stop,
            data: _this.parse(data)
          });
        },

        error: function() {
          // TODO: handle error
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

        // Get time difference
        d.seconds = d.time.diff(moment(), 'seconds');
        d.minutes = d.seconds / 60;

        // Create a bus ID
        d.busID = d.Route + d.Terminal;

        return d;
      }),

      // Sort by time
      function(d) {
        return d.time.unix();
      });
    }
  });

  // Add to window
  w.Furball = Furball;
})(window);
