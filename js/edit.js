/*
 * edit.js
 * Bart Trzynadlowski, 2023
 *
 * EditOperation interface and concrete implementations. These handle editing
 * operations in the canvas window. A single given operation is active at any
 * given time.
 */


/*
 * EditOperation:
 *
 * All edit operations must implement this interface.
 */

function EditOperation()
{
}

EditOperation.prototype.draw = function(ctx) {};
EditOperation.prototype.onMouseMove = function(x, y) {};
EditOperation.prototype.onMouseDown = function(x, y) {};
EditOperation.prototype.onMouseUp = function(x, y) {};
EditOperation.prototype.cancel = function() {};


/*
 * DrawBlockOperation:
 *
 * Fills a rectangle in the grid. Mouse down to begin, mouse up to end.
 */

function DrawBlockOperation(grid)
{
  this._grid = grid;
  this._cursor = { x: 0, y: 0 };
  this._corner1 = null;
  this._corner2 = null;

  this._fill = function()
  {
    if (this._corner1 == null || this._corner2 == null)
    {
      return;
    }

    var corner1Idxs = this._grid.canvasToGridIndices(this._corner1.x, this._corner1.y);
    var corner2Idxs = this._grid.canvasToGridIndices(this._corner2.x, this._corner2.y);
    this._grid.fillRectangle(corner1Idxs.xi, corner1Idxs.yi, corner2Idxs.xi, corner2Idxs.yi, true);

    // Reset operation
    this._corner1 = null;
    this._corner2 = null;
  }
};

DrawBlockOperation.prototype = new EditOperation();

DrawBlockOperation.prototype.draw = function(ctx)
{
  if (this._corner1)
  {
    // Note: rect() does not care about signs; no need to order corners
    var corner1 = this._corner1;
    var corner2 = !this._corner2 ? this._cursor : this._corner2;
    ctx.beginPath();
    ctx.rect(corner1.x, corner1.y, corner2.x - corner1.x, corner2.y - corner1.y);
    ctx.fillStyle = "#e50";
    ctx.fill();
  }
};

DrawBlockOperation.prototype.onMouseMove = function(x, y)
{
  this._cursor = { x: x, y: y };
};

DrawBlockOperation.prototype.onMouseDown = function(x, y)
{
  this._cursor = { x: x, y: y };
  this._corner1 = { x: x, y: y };
  this._corner2 = null;
};

DrawBlockOperation.prototype.onMouseUp = function(x, y)
{
  this._cursor = { x: x, y: y };
  this._corner2 = { x: x, y: y };
  this._fill();
};

DrawBlockOperation.prototype.cancel = function()
{
  this._corner1 = null;
  this._corner2 = null;
};
