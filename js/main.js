/*
 * main.js
 * Bart Trzynadlowski, 2023
 *
 * Main program.
 */

var g_canvas;
var g_ctx;

// Grid
var g_grid;

// Edit operation
var g_currentOperation = new EditOperation();

// List of colored rectangles to draw: color, xi1, yi1, xi2, yi2
var g_coloredRectIdxs = [];
var g_currentDisplayedRectIdx = -1; // -1 to display all or a specific index

// List of arbitrary colors
var s_colors = [
  "#ff0000",
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#0000ff",
  "#ff00ff",
  "#ff4000",
  "#bfff00",
  "#00ff40",
  "#00bfff",
  "#4000ff",
  "#ff00bf",
  "#ff8000",
  "#80ff00",
  "#00ff80",
  "#0080ff",
  "#8000ff",
  "#ff0080",
  "#ffbf00",
  "#40ff00",
  "#00ffbf",
  "#0040ff",
  "#bf00ff",
  "#ff0040"
];

function drawLine(x1, y1, x2, y2, color)
{
  g_ctx.beginPath();
  g_ctx.moveTo(x1, y1);
  g_ctx.lineTo(x2, y2);
  g_ctx.lineWidth = 1;
  g_ctx.strokeStyle = color;
  g_ctx.stroke();
}

function drawGrid()
{
  // Draw grid cells
  g_grid.draw(g_ctx);

  // Draw vertical lines
  var xStep = g_canvas.width / g_grid.width;
  for (var xi = 0; xi <= g_grid.width; xi++)
  {
    var x = Math.min(xi * xStep, g_canvas.width - 1);
    drawLine(x, 0, x, g_canvas.height - 1, "#000");
  }

  // Draw horizontal lines
  var yStep = g_canvas.height / g_grid.height;
  for (var yi = 0; yi <= g_grid.height; yi++)
  {
    var y = Math.min(yi * yStep, g_canvas.height - 1);
    drawLine(0, y, g_canvas.width - 1, y, "#000");
  }
}

function drawRect(ctx, xi1, yi1, xi2, yi2, color)
{
  var xStep = g_canvas.width / g_grid.width;
  var yStep = g_canvas.height / g_grid.height;
  for (var yi = yi1; yi <= yi2; yi++)
  {
    for (var xi = xi1; xi <= xi2; xi++)
    {
      var canvasCoords = g_grid.gridToCanvas(xi, yi);
      var x1 = canvasCoords.x - 0.5 * xStep;
      var y1 = canvasCoords.y - 0.5 * yStep;
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.fillRect(x1, y1, xStep, yStep);
      ctx.stroke();
    }
  }
}

function update()
{
  // Clear
  g_ctx.fillStyle = "#ffffff";
  g_ctx.fillRect(0, 0, g_canvas.width, g_canvas.height);

  // Edit operation
  g_currentOperation.draw(g_ctx);

  // Draw colored rectangles (search/partitioning operation results)
  for (var i = 0; i < g_coloredRectIdxs.length; i++)
  {
    if (g_currentDisplayedRectIdx < 0 || g_currentDisplayedRectIdx >= g_coloredRectIdxs.length || g_currentDisplayedRectIdx == i)
    {
      var coloredRect = g_coloredRectIdxs[i];
      drawRect(g_ctx, coloredRect.xi1, coloredRect.yi1, coloredRect.xi2, coloredRect.yi2, coloredRect.color);
    }
  }

  // Draw occupancy grid
  drawGrid();

  window.requestAnimationFrame(function() { update(); });
}

function setResults(coloredRectIdxs, currentDisplayedRectIdx)
{
  g_coloredRectIdxs = coloredRectIdxs;
  if (currentDisplayedRectIdx < -1 || currentDisplayedRectIdx >= coloredRectIdxs.length)
  {
    // Bounds
    currentDisplayedRectIdx = -1;
  }
  g_currentDisplayedRectIdx = currentDisplayedRectIdx == null ? -1 : currentDisplayedRectIdx;

  $("#DisplayedResults").text("foo");
  if (g_coloredRectIdxs.length == 0)
  {
    $("#DisplayedResults").text("none");
  }
  else
  {
    $("#DisplayedResults").text(g_currentDisplayedRectIdx < 0 ? "all" : (g_currentDisplayedRectIdx + "/" + (g_coloredRectIdxs.length - 1)));
  }

  var disableButtons = g_coloredRectIdxs.length <= 1;
  $("#PrevResultButton").prop("disabled", disableButtons);
  $("#NextResultButton").prop("disabled", disableButtons);
}

function onMouseMove(event)
{
  var gridCoords = g_grid.canvasToGridCoordinate(event.offsetX, event.offsetY);
  var gridIdxs =  g_grid.canvasToGridIndices(event.offsetX, event.offsetY);
  $("#Coords").text("(x,y)=(" + gridCoords.x.toFixed(1) + "," + gridCoords.y.toFixed(1) + "), (xi,yi)=(" + gridIdxs.xi + "," + gridIdxs.yi + ")");

  g_currentOperation.onMouseMove(event.offsetX, event.offsetY);
}

function onMouseDown(event)
{
  g_currentOperation.onMouseDown(event.offsetX, event.offsetY);
  setResults([]); // reset results
}

function onMouseUp(event)
{
  g_currentOperation.onMouseUp(event.offsetX, event.offsetY);
}

function onOperationListChanged()
{
  g_currentOperation.cancel();

  var operation = $("#Operation").val();
  if (operation == "DrawBlock")
  {
    g_currentOperation = new DrawBlockOperation(g_grid);
  }
}

function onResetButtonPressed()
{
  setResults([]);
  g_grid.clear();
}

function onPrevResultButtonPressed()
{
  g_currentDisplayedRectIdx -= 1;
  if (g_currentDisplayedRectIdx < -1) // -1 indicates show all and is a valid index value
  {
    g_currentDisplayedRectIdx = g_coloredRectIdxs.length - 1;
  }
  setResults(g_coloredRectIdxs, g_currentDisplayedRectIdx);
}

function onNextResultButtonPressed()
{
  g_currentDisplayedRectIdx += 1;
  if (g_currentDisplayedRectIdx >= g_coloredRectIdxs.length)
  {
    g_currentDisplayedRectIdx = -1;
  }
  setResults(g_coloredRectIdxs, g_currentDisplayedRectIdx);
}

function onMaximumRectangleButtonPressed()
{
  setResults([]);
  var rect = findMaxRectangleIndices(g_grid, false);
  if (rect != null)
  {
    console.log(rect);
    setResults( [{ color: "#48e", xi1: rect.xi1, yi1: rect.yi1, xi2: rect.xi2, yi2: rect.yi2 }] );
  }
}

function onPartitionButtonPressed()
{
  var coloredRectIdxs = [];
  var rects = [];

  var algo = $("#PartitionAlgorithm").val();
  switch (algo)
  {
  case "Greedy":
    rects = partitionIntoRectanglesGreedy(g_grid, false);
    break;
  case "IterativeMaximum":
    rects = partitionIntoRectanglesIterativeMaximum(g_grid, false);
    break;
  default:
    console.log("Error: Invalid partitioning algorithm: " + algo);
    break;
  }

  console.log("Partition results: " + rects.length + " rectangles");
  for (var i = 0; i < rects.length; i++)
  {
    var rect = rects[i];
    var color = s_colors[i % s_colors.length];
    coloredRectIdxs.push( { color: color, xi1: rect.xi1, yi1: rect.yi1, xi2: rect.xi2, yi2: rect.yi2 } );
  }

  setResults(coloredRectIdxs);
}

function onSearchButtonPressed()
{
  var coloredRectIdxs = [];
  var rects = [];

  var requiredWidth = parseInt($("#WidthField").val());
  var requiredHeight = parseInt($("#HeightField").val());
  var algo = $("#SearchAlgorithm").val();
  switch (algo)
  {
  case "MinimumDimensions":
    rects = findRectanglesOfMinimumDimensions(g_grid, requiredWidth, requiredHeight, false);
    break;
  case "ExactDimensions":
    rects = findRectanglesOfExactDimensions(g_grid, requiredWidth, requiredHeight, false);
    break;
  default:
    break;
  }

  console.log("Search results: " + rects.length + " rectangles");
  for (var i = 0; i < rects.length; i++)
  {
    var rect = rects[i];
    var color = s_colors[i % s_colors.length];
    coloredRectIdxs.push( { color: color, xi1: rect.xi1, yi1: rect.yi1, xi2: rect.xi2, yi2: rect.yi2 } );
  }

  setResults(coloredRectIdxs);
}

function rectangleSearchUI()
{
  g_canvas = document.getElementById("Viewport");
  g_ctx = g_canvas.getContext("2d");
  g_grid = new OccupancyGrid(100, 100, g_canvas);

  $("#Viewport").mousedown(onMouseDown);
  $("#Viewport").mouseup(onMouseUp);
  $("#Viewport").mousemove(onMouseMove);
  $("#Operation").change(onOperationListChanged);
  onOperationListChanged(); // pick up initial value
  $("#ResetButton").click(onResetButtonPressed);
  $("#PrevResultButton").click(onPrevResultButtonPressed);
  $("#NextResultButton").click(onNextResultButtonPressed);
  $("#MaximumRectangleButton").click(onMaximumRectangleButtonPressed);
  $("#PartitionButton").click(onPartitionButtonPressed);
  $("#SearchButton").click(onSearchButtonPressed);

  setResults([]);

  window.requestAnimationFrame(function()
  {
    update();
  });
}