/**
 * A crude version of snap to line to work
 * with multi line.
 */

(function() {
  turf.scratchPost = function(line, point) {
    var distance = Infinity;
    var closest;

    if (line.geometry.type === 'LineString') {
      return turf.pointOnLine(line, point);
    }
    else if (line.geometry.type === 'MultiLineString') {
      // Go through each line and determine which point is
      // the closest
      _.each(line.geometry.coordinates, function(l) {
        var currentLine = turf.linestring(l);
        var currentPoint = turf.pointOnLine(currentLine, point);
        var currentDistance = turf.distance(point, currentPoint);

        if (currentDistance < distance) {
          distance = currentDistance;
          closest = currentPoint;
        }
      });

      return currentPoint;
    }
    else {
      return point;
    }
  };
})();
