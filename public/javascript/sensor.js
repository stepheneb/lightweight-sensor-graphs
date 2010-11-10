(function() {

var root = this;
var sensor = {};

sensor.AppletGrapher = function(applet, graph, sensor_type) {
  this.applet = applet;
  this.graph = graph;
  this.sensor_type = sensor_type;
  this.Canvas();
  this.TimeSeries();
  this.Chart();
  this.AddButtons();
};

sensor.AppletGrapher.prototype.Canvas = function() {
  this.canvas = document.createElement('canvas');
  this.canvas.width = 540;
  this.canvas.height = 300;
  this.graph.appendChild(this.canvas);
};

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

sensor.AppletGrapher.prototype.AddButtons = function() {
  var ul = document.createElement('ul');
  ul.className = "sensorbuttons";
  this.graph.appendChild(ul);
  
  this.startButton = document.createElement('a');
  this.AddButton(ul, this.startButton, 'Start');
  this.startButton.onclick = (function(ag) {
    return function () {
      with(ag) {
        chart.streamTo(canvas, 500);
        applet.startCollecting();
        return true;
      }
    };
  })(this);
  
  this.stopButton = document.createElement('a');
  this.AddButton(ul, this.stopButton,  'Stop');
  this.stopButton.onclick = (function (ag) {
    return function () {
      with(ag) {
        applet.stopCollecting();
        chart.stop();
        return true;          
      }
    };
  })(this);

  this.clearButton = document.createElement('a');
  this.AddButton(ul, this.clearButton, 'Clear');
  this.clearButton.onclick = (function (ag) {
    return function () {
      with(ag) {
        applet.stopCollecting();
        TimeSeries();
        Chart();
        return true;
      }
    };
  })(this);
};

sensor.AppletGrapher.prototype.AddButton = function(list, button, name) {
  li = document.createElement('li');
  list.appendChild(li);
  button.classname = 'sensor_button';
  button.href = '#';
  button.innerHTML = name;
  li.appendChild(button);
  return button;
};

sensor.AppletGrapher.prototype.JsListener = function() {
  var timeseries = this.timeseries;
  return {
    dataReceived: function(type,count,data) {
      if (type === 1000) {
        timeseries.append(new Date().getTime(), data[0]);
      };
    },
    dataStreamEvent: function(type,count,data) {
      if (type === 1000) {
        timeseries.append(new Date().getTime(), data[0]);
      };
    },
    sensorsReady: function() {
    }
  };
};

sensor.AppletGrapher.prototype.InitSensorInterface = function(jsListenerStr) {
  this.applet.initSensorInterface(jsListenerStr);
};

// export namespace
if (root !== 'undefined') root.sensor = sensor;
})();
