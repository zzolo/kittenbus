/**
 * Main JS
 */

$(document).ready(function() {
  // Some vars
  var $loading = $('.loading');
  var furball = new Furball();

  // Templates
  var templates = {};
  templates.timeListing = _.template($('#time-listing-value-template').html());

  // Update time listing
  function timeListing(data) {
    // Join data
    var times = d3.select('.time-listing').selectAll('.time-value')
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
        return templates.timeListing({ d: d });
      });

    // Remove
    times.exit().remove();
  }

  // Handle furball update
  furball.on('stop', function(data) {
    console.log(data);

    // Time display
    timeListing(data.data);
  });

  // Ready
  function ready(error, data) {
    // Remove loader
    $loading.fadeOut('fast');

    // Start fullball
    furball.start();
  }

  // Get data
  function getData(done) {
    $.ajax({
      url: 'data/build/routes.geo.json',
      type: 'GET',
      dataType: 'json',
      success: function(data) {
        done(null, data);
      },

      error: function() {
        done(arguments, null);
      }
    });
  }

  // Get data
  getData(ready);
});
