/*
 * rectangle_search.js
 * Bart Trzynadlowski, 2023
 *
 * Search for rectangles of given dimensions in a grid.
 *
 * TODO:
 * -----
 * - A version of these functions is needed that allows minWidth and minHeight to be
 *   interchangeable. For example, if searching for floor positions, rectangles can be oriented
 *   either way. A simple solution is to provide a version that calls these functions twice in
 *   a row with the dimensions swapped.
 * - Potential optimization over brute force search: partition all *occupied* cells and test
 *   against those rectangles. The rectangle edges could be used as starting points for
 *   searches. If there are not too many rectangles, rectangle-rectangle tests may be faster.
 */

function findRectanglesOfExactDimensions(grid, width, height, occupancy)
{
  if (width <= 0 || height <= 0 || width > grid.width || height > grid.height || !isFinite(width) || !isFinite(height))
  {
    // Sanity check
    return [];
  }

  var rects = [];
  var obstructed = !occupancy;

  // We scan top to bottom and left to right. As we proceed left to right, we cache the maximum y
  // position blocking a rectangle originating (i.e., its upper-left corner) at that column. That
  // is, for a rectangle of size 10x10, with upper left corner at (x=5,y=1) and an obstruction at
  // (x=9,y=8), with no obstructions in that rectangle at y < 8, the entry at column 5 is 8. This
  // allows for rapid rejection at subsequent rows.
  var nearestYObstructionAtX = Array(grid.width).fill(-1);
  var wasRectangleObstructedAtX = Array(grid.width);  // at each xi, we can look back one
  for (var yi = 0; yi < grid.height; yi++)
  {
    for (var xi = 0; xi < grid.width; xi++)
    {
      var rect = { xi1: xi, yi1: yi, xi2: xi + width - 1, yi2: yi + height - 1 };

      // If rectangle is out of bounds, stop
      if (rect.xi2 >= grid.width || rect.yi2 >= grid.height)
      {
        break;
      }

      // At this column, can we quickly reject the rectangle by checking to see if there is a known
      // obstruction?
      var obstructionYi = nearestYObstructionAtX[xi];
      if (obstructionYi >= rect.yi1 && obstructionYi <= rect.yi2)
      {
        // There is an obstruction, this rectangle must be rejected
        wasRectangleObstructedAtX[xi] = true;
        continue;
      }

      // Maybe clear. Do we need to do a full rect check or just the next column?
      var foundObstruction = false;
      if (xi == 0 || wasRectangleObstructedAtX[xi - 1])
      {
        // Check full rectangle because we just started a new row or because previous column
        // rectangle was obstructed. In the latter case, we re-do the whole check, which is
        // wasteful, but we only cache a column at a time and don't have visibility beyond that.
        for (var ryi = rect.yi1; ryi <= rect.yi2 && !foundObstruction; ryi++)
        {
          for (var rxi = rect.xi1; rxi <= rect.xi2; rxi++)
          {
            if (grid.at(rxi, ryi) == obstructed)
            {
              nearestYObstructionAtX[xi] = ryi;
              foundObstruction = true;
              break;
            }
          }
        }

        wasRectangleObstructedAtX[xi] = foundObstruction;
      }
      else
      {
        // Only need to check right most column
        var rxi = rect.xi2;
        for (var ryi = rect.yi1; ryi <= rect.yi2; ryi++)
        {
          if (grid.at(rxi, ryi) == obstructed)
          {
            nearestYObstructionAtX[xi] = ryi;
            foundObstruction = true;
            break;
          }
        }

        wasRectangleObstructedAtX[xi] = foundObstruction;
      }

      // Is this rectangle good?
      if (!foundObstruction)
      {
        rects.push(rect);
      }
    }
  }

  return rects;
}

function findRectanglesOfMinimumDimensions(grid, minWidth, minHeight, occupancy)
{
  // Partition grid into rectangles
  var rects = partitionIntoRectanglesIterativeMaximum(g_grid, occupancy);

  // Save rectangles that fit the size requirement
  var resultRects = rects.filter(rect => _rectWidth(rect) >= minWidth && _rectHeight(rect) >= minHeight);

  // Next, create new rectangles by looking at all adjacent rectangles whose shared edge passes the
  // appropriate size constraint and whose resulting opposite side does as well
  for (var i = 0; i < rects.length; i++)
  {
    for (var j = i + 1; j < rects.length; j++)
    {
      var combinedRect = _combineRects(rects[i], rects[j]);
      if (combinedRect != null && _rectWidth(combinedRect) >= minWidth && _rectHeight(combinedRect) >= minHeight)
      {
        resultRects.push(combinedRect);
      }
    }
  }

  return resultRects;
}

function _rectWidth(rect)
{
  return rect.xi2 - rect.xi1 + 1;
}

function _rectHeight(rect)
{
  return rect.yi2 - rect.yi1 + 1;
}

/*
 * Combined two rectangles by looking for a shared edge and creating a new rectangle with a side
 * matching that length and the other side corresponding to the sum of the other side lengths.
 *
 * Example:
 *
 * +------------+                +-----+------+
 * |            |                |     |      |
 * |  A         |                |     |  C   |
 * |            |                |     |      |
 * |            |         ==>    |     |      |
 * +------------+                +-----|      |
 *       +-------------+               |      |------+
 *       |    B        |               |      |      |
 *       |             |               |      |      |
 *       +-------------+               +------+------+
 *
 * We assume that the input rectangles do not overlap!
 */
function _combineRects(a, b)
{
  // Either a vertical or horizontal edge will be shared. Try each.
  var combinedRect = _combineRectsAlongVerticalEdge(a, b);
  if (combinedRect == null)
  {
    combinedRect = _combineRectsAlongHorizontalEdge(a, b);
  }
  return combinedRect;
}

function _combineRectsAlongVerticalEdge(a, b)
{
  // Ensure a is to the left of b (left edge of a <= left edge of b)
  if (b.xi1 < a.xi1)
  {
    var tmp = a;
    a = b;
    b = tmp;
  }

  // We may have a shared vertical edge if and only if a's right edge is one unit less than b's
  // left edge. If the rectangles overlap along the horizontal dimension, then given our
  // requirement of non-overlapping input rectangles, one must be purely above the other.
  if (a.xi2 != (b.xi1 - 1))
  {
    return null;
  }

  // Now we need to check to see if the vertical edges overlap
  if (a.yi1 > b.yi2 || a.yi2 < b.yi1)
  {
    // No shared segment
    return null;
  }

  // Compute the shared segment
  var yi1 = a.yi1 < b.yi1 ? b.yi1 : a.yi1;
  var yi2 = a.yi2 < b.yi2 ? a.yi2 : b.yi2;

  // Now we have the combined rectangle
  return { xi1: a.xi1, yi1: yi1, xi2: b.xi2, yi2: yi2 };
}

function _combineRectsAlongHorizontalEdge(a, b)
{
  // Ensure a is above b (top edge of a <= top edge of b)
  if (b.yi1 < a.yi1)
  {
    var tmp = a;
    a = b;
    b = tmp;
  }

  // We may have a shared horizontal edge if and only if a's bottom edge is one unit less than b's
  // top edge. If the rectangles overlap along the vertical dimension, then given our requirement
  // of non-overlapping input rectangles, one must be next to the other.
  if (a.yi2 != (b.yi1 - 1))
  {
    return null;
  }

  // Now we need to check to see if the horizontal edges overlap
  if (a.xi1 > b.xi2 || a.xi2 < b.xi1)
  {
    // No shared segment
    return null;
  }

  // Compute the shared segment
  var xi1 = a.xi1 < b.xi1 ? b.xi1 : a.xi1;
  var xi2 = a.xi2 < b.xi2 ? a.xi2 : b.xi2;

  // Now we have the combined rectangle
  return { xi1: xi1, yi1: a.yi1, xi2: xi2, yi2: b.yi2 };
}