// MIT License:
//
// Copyright (c) 2010, Joe Walnes
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

//
// Smoothie Charts - http://smoothiecharts.org/
// (c) 2010, Joe Walnes
//
// - v1.0: Main charting library, by Joe Walnes
// - v1.1: Auto scaling of axis, by Neil Dunn
// - v1.2: fps (frames per second) option, by Mathias Petterson
// - v1.3: Fix for divide by zero, by Paul Nikitochkin
//
// Modifications for use with sensor.js (c) 2010 The Concord Consortium.
// Created by Stephen Bannasch. Modified smoothie.js may be freely 
// distributed under the LGPL license.

// TimeSeries
// ----------------
// Example:
//
//     TimeSeries({ min:0, max:5 });
//
function TimeSeries(options) {
  options = options || {};
  options.min = options.min || 0;
  options.max = options.max || 40
  this.options = options
  this.data = [];
  // The maximum value ever seen in this time series.
  this.max = this.options.max;
  // The minimum value ever seen in this time series.
  this.min = this.options.min;
}

TimeSeries.prototype.append = function(timestamp, value) {
  this.data.push([timestamp, value]);
  if (value > this.Max) {
    this.max = value;
  }
  if (value < this.min) {
    this.min = value;
  }
};

// SmoothieChart
// ----------------
// Example:
//
//     var chart = new SmoothieChart({
//       grid: { strokeStyle:'rgb(100, 100, 100)', 
//               fillStyle:'rgb(10, 10, 10)',
//               lineWidth: 1, millisPerLine: 1000, 
//               verticalSections: 8 },
//       labels: { fillStyle:'rgb(255, 255, 255)' }
//       });

function SmoothieChart(options) {
  // Defaults
  options = options || {};
  options.grid = options.grid || { fillStyle:'#000000', strokeStyle: '#777777', lineWidth: 1, millisPerLine: 1000, verticalSections: 2 };
  options.millisPerPixel = options.millisPerPixel || 20;
  options.fps = options.fps || 20;
  options.labels = options.labels || { fillStyle:'#ffffff' }
  this.options = options;
  this.seriesSet = [];
  this.timeout = null;
}

// ### chart.addTimeSeries(*timeSeries*, *options*)
SmoothieChart.prototype.addTimeSeries = function(timeSeries, options) {
  this.seriesSet.push({timeSeries: timeSeries, options: options || {}});
};

// commented out:

//     SmoothieChart.prototype.display = function(canvas) {
//       var self = this;
//       (function render() {
//         self.render(canvas, new Date().getTime());
//       })()
//     };

// ### chart.streamTo(*canvas*, *delay*)
SmoothieChart.prototype.streamTo = function(canvas, delay) {
  var self = this;
  (function render() {
    self.render(canvas, new Date().getTime() - (delay || 0));
    self.timeout = setTimeout(render, 1000/self.options.fps);
  })()
};

// ### chart.stop()
SmoothieChart.prototype.stop = function() {
  clearTimeout(this.timeout);
};

// ### chart.render(*canvas*, *time*)
SmoothieChart.prototype.render = function(canvas, time) {
  var canvasContext = canvas.getContext("2d");
  var options = this.options;
  var dimensions = {top: 0, left: 0, width: canvas.clientWidth, height: canvas.clientHeight};

  // Save the state of the canvas context, any transformations applied in this method
  // will get removed from the stack at the end of this method when .restore() is called.
  canvasContext.save();

  // Round time down to pixel granularity, so motion appears smoother.
  time = time - time % options.millisPerPixel;

  // Move the origin.
  canvasContext.translate(dimensions.left, dimensions.top);
  
  // Create a clipped rectangle - anything we draw will be constrained to this rectangle.
  // This prevents the occasional pixels from curves near the edges overrunning and creating
  // screen cheese (that phrase should neeed no explanation).
  canvasContext.beginPath();
  canvasContext.rect(0, 0, dimensions.width, dimensions.height);
  canvasContext.clip();

  // Clear the working area.
  canvasContext.save();
  canvasContext.fillStyle = options.grid.fillStyle;
  canvasContext.fillRect(0, 0, dimensions.width, dimensions.height);
  canvasContext.restore();

  // Grid lines....
  canvasContext.save();
  canvasContext.lineWidth = options.grid.lineWidth || 1;
  canvasContext.strokeStyle = options.grid.strokeStyle || '#ffffff';
  // Vertical (time) dividers.
  if (options.grid.millisPerLine > 0) {
    for (var t = time - (time % options.grid.millisPerLine); t >= time - (dimensions.width * options.millisPerPixel); t -= options.grid.millisPerLine) {
      canvasContext.beginPath();
      var gx = Math.round(dimensions.width - ((time - t) / options.millisPerPixel));
      canvasContext.moveTo(gx, 0);
      canvasContext.lineTo(gx, dimensions.height);
      canvasContext.stroke();
      canvasContext.closePath();
    }
  }

  var maxValue;
  var minValue;
  
  // Calculate the current scale of the chart, from all time series.

  for (var d = 0; d < this.seriesSet.length; d++) {
      // TODO(ndunn): We could calculate / track these values as they stream in.
      var timeSeries = this.seriesSet[d].timeSeries;
      if (!isNaN(timeSeries.max)) {
          maxValue = !isNaN(maxValue) ? Math.max(maxValue, timeSeries.max) : timeSeries.max;
      }

      if (!isNaN(timeSeries.min)) {
          minValue = !isNaN(minValue) ? Math.min(minValue, timeSeries.min) : timeSeries.min;
      }
  }

  if (isNaN(maxValue) && isNaN(minValue)) {
      return;
  }

  var valueRange = maxValue - minValue;
  var valueGridIncrement = Math.pow(10, (Math.round(Math.log(valueRange)/(1/Math.LOG10E))-1))*2;
  var valueGridIncrement2 = valueGridIncrement/2;
  

  // commented out:

  //     Horizontal (value) dividers.
  //     for (var v = 1; v < options.grid.verticalSections; v++) {
  //       var gy = Math.round(v * dimensions.height / options.grid.verticalSections);
  //       canvasContext.beginPath();
  //       canvasContext.moveTo(0, gy);
  //       canvasContext.lineTo(dimensions.width, gy);
  //       canvasContext.stroke();
  //       canvasContext.closePath();
  //     }


  // Horizontal (value) dividers.
  var minValue2 = minValue*2;
  var maxValue2 = (maxValue-1)*2;
  var yGrids = [];
  for (var i = minValue2; i < maxValue2; i = i + valueGridIncrement) { yGrids.push(Math.ceil((i+valueGridIncrement2)/valueGridIncrement)/2*valueGridIncrement-minValue) }
  var yGridsLength = yGrids.length;
  var yScaleFactor = dimensions.height / valueRange;

  var ygrid;

  for (i = 0; i < yGridsLength; i++) {
     gy = yGrids[i] * yScaleFactor;
     canvasContext.beginPath();
     canvasContext.moveTo(0, gy);
     canvasContext.lineTo(dimensions.width, gy);
     canvasContext.stroke();
     canvasContext.closePath();    
  }

  // Bounding rectangle.
  canvasContext.beginPath();
  canvasContext.strokeRect(0, 0, dimensions.width, dimensions.height);
  canvasContext.closePath();
  canvasContext.restore();

  // For each data set...
  for (var d = 0; d < this.seriesSet.length; d++) {
    canvasContext.save();
    var timeSeries = this.seriesSet[d].timeSeries;
    var dataSet = timeSeries.data;
    var seriesOptions = this.seriesSet[d].options;

    // Delete old data that's moved off the left of the chart.
    // We must always keep the last expired data point as we need this to draw the
    // line that comes into the chart, but any points prior to that can be removed.
    while (dataSet.length >= 2 && dataSet[1][0] < time - (dimensions.width * options.millisPerPixel)) {
      dataSet.splice(0, 1);
    }

    // Set style for this dataSet.
    canvasContext.lineWidth = seriesOptions.lineWidth || 1;
    canvasContext.fillStyle = seriesOptions.fillStyle;
    canvasContext.strokeStyle = seriesOptions.strokeStyle || '#ffffff';
    // Draw the line...
    canvasContext.beginPath();
    // Retain lastX, lastY for calculating the control points of bezier curves.
    var firstX = 0, lastX = 0, lastY = 0;
    for (var i = 0; i < dataSet.length; i++) {
      // TODO: Deal with dataSet.length < 2.
      var x = Math.round(dimensions.width - ((time - dataSet[i][0]) / options.millisPerPixel));
      var value = dataSet[i][1];
      var offset = maxValue - value;
      var scaledValue = valueRange ? Math.round((offset / valueRange) * dimensions.height) : 0;
      var y = Math.max(Math.min(scaledValue, dimensions.height - 1), 1); // Ensure line is always on chart.

      if (i == 0) {
        firstX = x;
        canvasContext.moveTo(x, y);
      }
      // Wikipedia has a great explanation of [Bezier curves](http://en.wikipedia.org/wiki/Bezier_curve#Quadratic_curves)
      //
      // Assuming A was the last point in the line plotted and B is the new point,
      // we draw a curve with control points P and Q as below.
      //
      //     A---P
      //         |
      //         |
      //         |
      //         Q---B
      //
      // Importantly, A and P are at the same y coordinate, as are B and Q. This is
      // so adjacent curves appear to flow as one.
      //
      else {
        // startPoint (A) is implicit from last iteration of loop
        canvasContext.bezierCurveTo( 
          // controlPoint1 (P)
          Math.round((lastX + x) / 2), lastY, 
          // controlPoint2 (Q)
          Math.round((lastX + x)) / 2, y, 
          // endPoint (B)
          x, y); 
      }
      lastX = x, lastY = y;
    }
    if (dataSet.length > 0 && seriesOptions.fillStyle) {
      // Close up the fill region.
      canvasContext.lineTo(dimensions.width + seriesOptions.lineWidth + 1, lastY);
      canvasContext.lineTo(dimensions.width + seriesOptions.lineWidth + 1, dimensions.height + seriesOptions.lineWidth + 1);
      canvasContext.lineTo(firstX, dimensions.height + seriesOptions.lineWidth);
      canvasContext.fill();
    }
    canvasContext.stroke();
    canvasContext.closePath();
    canvasContext.restore();
  }

  // Draw the axis values on the chart.
  if (!options.labels.disabled) {
      canvasContext.fillStyle = options.labels.fillStyle;
      canvasContext.font = "12pt Arial";
      var maxValueString = maxValue.toFixed(2);
      var minValueString = minValue.toFixed(2);
      canvasContext.fillText(maxValueString, dimensions.width - canvasContext.measureText(maxValueString).width - 2, 15);
      canvasContext.fillText(minValueString, dimensions.width - canvasContext.measureText(minValueString).width - 2, dimensions.height - 2);
  }

  canvasContext.restore(); // See .save() above.
}
