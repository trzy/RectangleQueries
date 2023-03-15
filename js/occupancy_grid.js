/*
 * occupancy_grid.js
 * Bart Trzynadlowski, 2023
 *
 * Two-dimensional occupancy grid structure.
 */

function OccupancyGrid(width, height, canvas)
{
  // Dimensions in cells
  this.width = width;
  this.height = height;

  // Grid
  this._grid = Array.from(Array(height), () => new Array(width).fill(false)); // 2D array of height x width (false if unoccupied, true if occupied)

  // Canvas dimensions in pixels (for conversion between rendered representation and grid cells)
  this._canvasWidth = canvas.width;
  this._canvasHeight = canvas.height;

  this._deepCopyArray = function(arr)
  {
    let copy = [];
    arr.forEach(elem =>
    {
      if (Array.isArray(elem))
      {
        copy.push(this._deepCopyArray(elem))
      }
      else
      {
        if (typeof elem === 'object')
        {
          copy.push(this._deepCopyObject(elem))
        }
        else
        {
          copy.push(elem);
        }
      }
    });
    return copy;
  };

  this._deepCopyObject = function(obj)
  {
    let tempObj = {};
    for (let [key, value] of Object.entries(obj))
    {
      if (Array.isArray(value))
      {
        tempObj[key] = this._deepCopyArray(value);
      }
      else
      {
        if (typeof value === 'object')
        {
          tempObj[key] = this._deepCopyObject(value);
        }
        else
        {
          tempObj[key] = value;
        }
      }
    }
    return tempObj;
  };
}

// A really braindead way to deep-clone the object. I hate JavaScript!
OccupancyGrid.prototype.clone = function()
{
  var obj =
  {
    width: this.width,
    height: this.height,
    _grid: this._deepCopyObject(this._grid),
    _canvasWidth: this._canvasWidth,
    _canvasHeight: this._canvasHeight,
    at: this.at,
    canvasToGridCoordinate: this.canvasToGridCoordinate,
    canvasToGridIndices: this.canvasToGridIndices,
    gridToCanvas: this.gridToCanvas,
    fillRectangle: this.fillRectangle,
    clear: this.clear,
    draw: this.draw
  };
  return obj;
};

OccupancyGrid.prototype.at = function(xi, yi)
{
  return this._grid[yi][xi];
};

// From canvas to grid coordinates, where the grid point is at the center of the grid cell.
// That is, (0,0) is the *center* of the top-left-most grid cell and the cell extends from
// (-0.5, +0.5) along each direction.
OccupancyGrid.prototype.canvasToGridCoordinate = function(x, y)
{
  var xStep = this._canvasWidth / this.width;
  var yStep = this._canvasHeight / this.height;
  x = x / xStep - 0.5;
  y = y / yStep - 0.5;
  return { x: x, y: y };
};

// From canvas to grid indices, which are integral and suitable for indexing into a grid array.
// Note that grid cells extend from (-0.5, +0.5) about the actual index.
OccupancyGrid.prototype.canvasToGridIndices = function(x, y)
{
  var xStep = this._canvasWidth / this.width;
  var yStep = this._canvasHeight / this.height;
  var xi = Math.floor(x / xStep);
  var yi = Math.floor(y / yStep);
  return { xi: xi, yi: yi };
};

// Converts both a grid coordinate and grid indices to a canvas coordinate at the center of the
// grid cell.
OccupancyGrid.prototype.gridToCanvas = function(x, y)
{
  var xStep = this._canvasWidth / this.width;
  var yStep = this._canvasHeight / this.height;
  x = (Math.floor(x) + 0.5) * xStep;
  y = (Math.floor(y) + 0.5) * yStep;
  return { x: x, y: y };
};

OccupancyGrid.prototype.fillRectangle = function(xi1, yi1, xi2, yi2, occupied)
{
  // Clamp to boundaries
  xi1 = Math.min(Math.max(xi1, 0), this.width - 1);
  yi1 = Math.min(Math.max(yi1, 0), this.height - 1);
  xi2 = Math.min(Math.max(xi2, 0), this.width - 1);
  yi2 = Math.min(Math.max(yi2, 0), this.height - 1);

  // Canonical ordering
  if (xi1 > xi2)
  {
    var tmp = xi1;
    xi1 = xi2;
    xi2 = tmp;
  }

  if (yi1 > yi2)
  {
    var tmp = yi1;
    yi1 = yi2;
    yi2 = tmp;
  }

  // Fill
  for (var xi = xi1; xi <= xi2; xi++)
  {
    for (var yi = yi1; yi <= yi2; yi++)
    {
      this._grid[yi][xi] = occupied;
    }
  }
};

OccupancyGrid.prototype.clear = function()
{
  for (var yi = 0; yi < this.height; yi++)
  {
    for (var xi = 0; xi < this.height; xi++)
    {
      this._grid[yi][xi] = false;
    }
  }
};

// Draw occupied cells on canvas
OccupancyGrid.prototype.draw = function(ctx)
{
  var xStep = this._canvasWidth / this.width;
  var yStep = this._canvasHeight / this.height;
  for (var yi = 0; yi < this.height; yi++)
  {
    for (var xi = 0; xi < this.width; xi++)
    {
      if (this.at(xi, yi))
      {
        var canvasCoords = this.gridToCanvas(xi, yi);
        var x1 = canvasCoords.x - 0.5 * xStep;
        var y1 = canvasCoords.y - 0.5 * yStep;
        ctx.beginPath();
        ctx.fillStyle = "#888888";
        ctx.fillRect(x1, y1, xStep, yStep);
        ctx.stroke();
      }
    }
  }
};