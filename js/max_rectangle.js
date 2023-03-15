/*
 * max_rectangle.js
 * Bart Trzynadlowski, 2023
 *
 * Finds the maximum-area rectangle in an occupancy grid.
 */

// Returns the maximum rectangle, or null if there isn't one, in the designated region of the
// occupancy grid (occupied regions if occupancy = true, else the unoccupied regions)
function findMaxRectangleIndices(grid, occupancy)
{
  var widths = Array.from(Array(grid.height), () => new Array(grid.width).fill(0));
  var heights = Array.from(Array(grid.height), () => new Array(grid.width).fill(0));

  var bestArea = -1;
  var bestRectangle = null;

  for (var yi = 0; yi < grid.height; yi++)
  {
    for (var xi = 0; xi < grid.width; xi++)
    {
      if (grid.at(xi, yi) != occupancy)
      {
        // We are searching only regions of the desired occupancy status
        continue;
      }

      heights[yi][xi] = (yi == 0) ? 1 : (heights[yi - 1][xi] + 1);
      widths[yi][xi] = (xi == 0) ? 1 : (widths[yi][xi - 1] + 1);

      var minWidth = widths[yi][xi];

      for (var dh = 0; dh < heights[yi][xi]; dh++)
      {
        minWidth = Math.min(minWidth, widths[yi - dh][xi]);
        var area = (dh + 1) * minWidth;
        if (area > bestArea)
        {
          bestArea = area;
          var xi1 = xi - minWidth + 1;
          var yi1 = yi - dh;
          bestRectangle = { xi1: xi1, yi1: yi1, xi2: xi, yi2: yi };
        }
      }
    }
  }

  return bestRectangle;
}