//     sensor.js 0.1.0
//     (c) 2010 The Concord Consortium
//     created by Stephen Bannasch
//     sensor.js may be freely distributed under the LGPL license.

(function() {

// Initial Setup
// -------------

// The top-level namespace. All public classes will be attached to sensor.

var sensor = {};
var root = this;

// Current version of the library. Keep in sync with `package.json`.
sensor.VERSION = '0.1.0';

// sensor.AppletGrapher
// -----------------

// Create a new grapher.
//
// Parameters:
//
// - **applet**: the actual java sensor applet element
// - **graph**: a div element into which the graph canvas will be created
// - **sensor_type**: a string containing 'motion', 'light', or 'temperature'
// - **listener_str**: a string consisting of the variable the new applet grapher 
//   is being assigned to followed by '.JsListener()'.
//
// Here's an example:
//
//     var a = document.getElementById("sensor-applet");
//     var g =  document.getElementById("graph");
//     var st = 'temperature';
//     ag = new sensor.AppletGrapher(a, g, st, "ag.JsListener()");

sensor.AppletGrapher = function(applet, graph, sensor_type, listener_str) {
  this.applet = applet;
  this.graph = graph;
  this.sensor_type = sensor_type;
  this.listener_str = listener_str;
  this.applet_ready = false;
  this.Canvas();
  this.TimeSeries();
  this.Chart();
  this.AddButtons();
  this.appletInitializationTimer = false;
  this.StartAppletInitializationTimer();
};

// Setup a timer to check every 250 ms to see if the Java applet 
// has finished loading and is initialized.
sensor.AppletGrapher.prototype.StartAppletInitializationTimer = function() {
  var self = this;
  window.setTimeout (function()  { self.InitSensorInterface(); }, 250);
};

// Wait until the applet is loaded and initialized before enabling
// the data collection buttons.
sensor.AppletGrapher.prototype.InitSensorInterface = function() {
  var that = this;
  
  // Try to call initSensorInterface, but note:
  //
  //  1. appletInstance may not have initialized yet
  //  2. 'probing' for initialization via the js idiom:
  //      `appletInstance.initSensorInterface && appletInstance.initSensorInterface();`
  //      actually throws an error in IE even AFTER 
  //      `appletInstance.initSensorInterface` is ready to call, because
  //      IE thinks that it's an error to access a java method as 
  //      a property instead of calling it.
  
  try {
    that.applet_ready = that.applet &&  that.applet.initSensorInterface(that.listener_str);
  } catch (e) {
    // Do nothing--we'll try again in the next timer interval.
  }
  
  if(that.applet_ready) {
    that.startButton.className = "active";
    if(that.appletInitializationTimer) {
      clearInterval(that.appletPoller);
      that.appletPoller = false;
    }
  } else {
    that.startButton.className = "inactive";
    if(!that.appletInitializationTimer) {
      that.appletInitializationTimer = window.setInterval(function() { that.InitSensorInterface(); }, 250);
    }
  }
};

// This is the JavaScript function that the Java applet calls when data is ready.
sensor.AppletGrapher.prototype.JsListener = function() {
  var timeseries = this.timeseries;
  return {
    // called whenever data is received in the sensor. data is an array of floats
    dataReceived: function(type, count, data) {
      if (type === 1000) {
        timeseries.append(new Date().getTime(), data[0]);
      };
    },
    // called whenever meta data about the data stream changes, data is an array of floats
    dataStreamEvent: function(type, count, data) {
      if (type === 1000) {
        timeseries.append(new Date().getTime(), data[0]);
      };
    },
    sensorsReady: function() {
    }
  };
};

// Create a 2D canvas element to render the graph into
sensor.AppletGrapher.prototype.Canvas = function() {
  this.canvas = document.createElement('canvas');
  this.canvas.width = 540;
  this.canvas.height = 300;
  this.graph.appendChild(this.canvas);
};

// Setup a default timeseries based on the sensor_type
sensor.AppletGrapher.prototype.TimeSeries = function() {
  switch(this.sensor_type) {
    case 'motion':
      return this.timeseries = new TimeSeries({ min:0, max:5 });
      break;
    case 'light':
      return this.timeseries = new TimeSeries({ min:0, max:10000 });
      break;
    case 'temperature':
      return this.timeseries = new TimeSeries({ min:15, max:35 });
      break;
    default:
      return this.timeseries = new TimeSeries({ min:15, max:35 });
      break;
  };
};

// Use a customized version of SmoothieCharts for rendering
// the graph.
sensor.AppletGrapher.prototype.Chart = function() {
  var chart = new SmoothieChart({
    grid: { strokeStyle:'rgb(100, 100, 100)', fillStyle:'rgb(10, 10, 10)',
            lineWidth: 1, millisPerLine: 1000, verticalSections: 8 },
    labels: { fillStyle:'rgb(255, 255, 255)' }
    });
  this.chart = chart;
  this.chart.addTimeSeries(this.timeseries, { 
      strokeStyle: 'rgba(0, 255, 0, 1)', 
      fillStyle: 'rgba(0, 255, 0, 0.2)', 
      lineWidth: 4
    });
  this.chart.render(this.canvas, 500);
};

// Add the **Start**, **Stop**, and **Clear** buttons.
sensor.AppletGrapher.prototype.AddButtons = function() {
  var ul = document.createElement('ul');
  ul.className = "sensorbuttons";
  this.graph.appendChild(ul);
  
  this.startButton = document.createElement('a');
  if (this.applet_ready) {
    this.startButton.className = "active";
  } else {
    this.startButton.className = "inactive";
  };
  this.AddButton(ul, this.startButton, 'Start');
  this.startButton.onclick = (function(ag) {
    return function () {
      with(ag) {
        if (!applet_ready) {
          InitSensorInterface();
        };
        chart.streamTo(canvas, 500);
        applet.startCollecting();
        startButton.className = "inactive"
        stopButton.className = "active"
        return true;
      }
    };
  })(this);
  
  this.stopButton = document.createElement('a');
  this.stopButton.className = "inactive";
  this.AddButton(ul, this.stopButton,  'Stop');
  this.stopButton.onclick = (function (ag) {
    return function () {
      with(ag) {
        applet.stopCollecting();
        chart.stop();
        stopButton.className = "inactive"
        startButton.className = "active"
        clearButton.className = "active"
        return true;          
      }
    };
  })(this);

  this.clearButton = document.createElement('a');
  this.clearButton.className = "inactive";
  this.AddButton(ul, this.clearButton, 'Clear');
  this.clearButton.onclick = (function (ag) {
    return function () {
      with(ag) {
        applet.stopCollecting();
        TimeSeries();
        Chart();
        clearButton.className = "inactive"
        return true;
      }
    };
  })(this);
};

// Add a single button.
sensor.AppletGrapher.prototype.AddButton = function(list, button, name) {
  li = document.createElement('li');
  list.appendChild(li);
  button.classname = 'sensor_button';
  button.href = '#';
  button.innerHTML = name;
  li.appendChild(button);
  return button;
};

// export namespace
if (root !== 'undefined') root.sensor = sensor;
})();
