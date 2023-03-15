/*
 * rectangular_partition.js
 * Bart Trzynadlowski, 2023
 *
 * Partitions an occupancy grid into a series of rectangles.
 */

function partitionIntoRectanglesIterativeMaximum(grid, occupancy)
{
  var rects = [];
  var obstructed = !occupancy;

  // Need to make a copy of the occupancy grid so we can mark it up
  var workingGrid = grid.clone();

  var foundRectangle = false;
  do
  {
    foundRectangle = false;

    // Find the next maximum area rectangle
    var rect = findMaxRectangleIndices(workingGrid, occupancy);
    if (rect != null)
    {
      rects.push(rect);
      foundRectangle = true;

      // Mark the discovered rectangle as obstructed so we can find next one
      workingGrid.fillRectangle(rect.xi1, rect.yi1, rect.xi2, rect.yi2, obstructed);
    }
  } while (foundRectangle);

  return rects;
}

function partitionIntoRectanglesGreedy(grid, occupancy)
{
  var rects = [];

  // Copy of the grid where we mark which cells are occupied by a rect
  var filled = Array.from(Array(grid.height), () => new Array(grid.width).fill(false));

  // Greedily create rectangles by scanning line by line and growing rectangles to the right and
  // down
  for (var yi = 0; yi < grid.height; yi++)
  {
    var rectFound = false;
    var xi = 0;

    // Find as many rectangles as we can with their upper-left corner on this line
    do
    {
      rectFound = false;

      xi = _nextStartingX(grid, filled, xi, yi, occupancy); // starting column of next rectangle
      if (xi < grid.width)
      {
        // Attempt to grow a rectangle as far right as possible and as far down as possible
        var rect = _growRectangle(grid, filled, xi, yi, occupancy);
        rects.push(rect);
        rectFound = true;

        // Mark the area of the rectangle
        for (var j = rect.yi1; j <= rect.yi2; j++)
        {
          for (var i = rect.xi1; i <= rect.xi2; i++)
          {
            filled[j][i] = true;
          }
        }

        // Advance past the rectangle we just created
        xi = rect.xi2 + 1;
      }
    } while (rectFound);
  }

  return rects;
}

// On a given line yi, find the next xi (beginning at xi and moving right) that has the desired
// occupancy state and is not yet claimed by a rectangle
function _nextStartingX(grid, filled, xi, yi, occupancy)
{
  while (xi < grid.width)
  {
    var alreadyClaimedByAnotherRectangle = filled[yi][xi];
    if (!alreadyClaimedByAnotherRectangle && grid.at(xi, yi) == occupancy)
    {
      break;
    }
    xi++;
  }
  return xi;
}

function _growRectangle(grid, filled, xi1, yi1, occupancy)
{
  var xi2 = grid.width - 1;

  for (var yi = yi1; yi < grid.height; yi++)
  {
    // Proceed as far to the right as possible, up to existing rectangle width
    var hitObstacle = false;
    for (var xi = xi1; xi < grid.width && xi <= xi2; xi++)
    {
      var alreadyClaimedByAnotherRectangle = filled[yi][xi];
      if (grid.at(xi, yi) != occupancy || alreadyClaimedByAnotherRectangle)
      {
        // Hit a cell that cannot be included in the rectangle, capping its width
        hitObstacle = true;
        break;
      }
    }

    if (hitObstacle)
    {
      if (yi == yi1)
      {
        // Special case: very first line establishes width of rectangle
        xi2 = xi - 1;
      }
      else
      {
        // We must discard this line and return a rectangle that extends only to previous line
        return { xi1: xi1, yi1: yi1, xi2: xi2, yi2: yi - 1 };
      }
    }
  }

  return { xi1: xi1, yi1: yi1, xi2: xi2, yi2: grid.height - 1 };
}