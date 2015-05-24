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
  function ready(error, routes, map) {
    // Import map
    var $svgContainer = $('.svg-container');
    $svgContainer.append(map.documentElement);

    // Start fullball
    furball.start();

    // Remove loader
    $loading.fadeOut('fast');
  }

  // Get data
  function getData(done) {
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
            done(null, routes, map);
          },

          error: function() {
            done(arguments, null);
          }
        });
      },

      error: function() {
        done(arguments, null);
      }
    });
  }

  // Get data
  getData(ready);
});
