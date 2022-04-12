const csvFile = document.getElementById("csvFile");

csvFile.addEventListener("input", loadData)

var arrayRes
var zoomState = 0
				  
function loadData(e){
	e.preventDefault();
	const input = csvFile.files[0];
	const reader = new FileReader();
	reader.onload = function (e) {
        const text = e.target.result;
        const data = successFunction(text);
		
		var maxX = data["x"].reduce(function(a,b){
			return Math.max(a,b);
		},0);
		var maxY = data["y"].reduce(function(a,b){
			return Math.max(a,b);
		},0);
		var dragmode_ 
		if (zoomState==0){
			dragmode_ = "pan"
		}else{
			dragmode_ = "select"
		}
		var layout = {
		autosize: false,
		hovermode: false,
		showlegend: false,
		margin:{t:50, l:50, r:50, b:50
		},
		dragmode:dragmode_,
		width: 2 * document.getElementById("loader").offsetWidth,
		xaxis:{
			range:[0,maxX],
			autorange:false,
			title:{
				text:"Time (s)"
			}
		},
		yaxis:{
			range:[0,maxY],
			autorange:false,
			title:{
				text:"Absorbance"
			}
		}
		};
		var xydata = [{x:data["x"], y: data["y"], mode:"lines", line:{color:"black"}},
		{x:data["x"], y: data["y"], mode:"markers", opacity:0,marker:{color:"black"}},
		{x:[0, maxX*1.5], y:[0,0], mode:"lines",line:{color:"red"}}];
		GRAPH = document.getElementById("graph");
		Plotly.newPlot("graph", xydata, layout, {modeBarButtonsToRemove:["autoScale2d", "toggleSpikelines",
		"hoverClosestCartesian", "hoverCompareCartesian", "lasso2d", "resetScale2d","zoom2d", "pan2d", "select2d"], displayModeBar:true,displaylogo:false, scrollZoom:true});
		GRAPH.on('plotly_selected', function(eventData) {
		  var x = [];
		  var y = [];
		  eventData.points.forEach(function(pt) {
			x.push(pt.x);
			y.push(pt.y);
		  });
		  
		  var linReg = linearRegression(y,x);
		  var quadReg = curvature(x,y);
		  xydata[2]["y"][0] = linReg["intercept"];
		  xydata[2]["y"][1] = linReg["intercept"] + xydata[2]["x"][1]*linReg["slope"];
		  arrayRes = xydata[2];
		  Plotly.redraw("graph");
		  document.getElementById("start").textContent = x[0];
		  document.getElementById("end").textContent = x[x.length-1];
		  document.getElementById("slope").textContent = Math.abs((linReg["slope"]*60).toFixed(5));
		  document.getElementById("ndata").textContent = "# Data Points: "+x.length;
		  document.getElementById("devi").textContent = "Curvature: "+quadReg;
		});
      };

    reader.readAsText(input);
}

function findSlope(eventData){
  var x = [];
  var y = [];
  eventData.points.forEach(function(pt) {
    x.push(pt.x);
    y.push(pt.y);
  });
  
  var linReg = linearRegression(y,x)
  
}

function zoomZoom(){
	var GRAPH = document.getElementById("graph");
	var zoomInt = document.getElementById("zoomInt")
	var zoomButt = document.getElementById("zoomButt")
	if (zoomState == 0){
		Plotly.relayout(GRAPH, {dragmode:"select"})
		zoomInt.textContent = "Click and drag a box around the linear region of an assay. The table below will update with your values. Click \"Adjust View\" to adjust the view."
		zoomButt.textContent = "Adjust View"
		
	} else{
		Plotly.relayout(GRAPH, {dragmode:"pan"})
		zoomInt.textContent = "Click and drag to move around the graph. Scroll up and down to zoom. Click \"Analyze\" when you are ready to analyze an assay."
		zoomButt.textContent = "Analyze"
	};
	zoomState = 1 - zoomState;
	
}

function linearRegression(y,x){
        var lr = {};
        var n = y.length;
        var sum_x = 0;
        var sum_y = 0;
        var sum_xy = 0;
        var sum_xx = 0;
        var sum_yy = 0;

        for (var i = 0; i < y.length; i++) {

            sum_x += x[i];
            sum_y += y[i];
            sum_xy += (x[i]*y[i]);
            sum_xx += (x[i]*x[i]);
            sum_yy += (y[i]*y[i]);
        } 

        lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n*sum_xx - sum_x * sum_x);
        lr['intercept'] = (sum_y - lr.slope * sum_x)/n;
        return lr;
}

function curvature(x,y){
  //quadratic regression
  var X = math.transpose([math.ones(x.length), x, math.square(x)])
  var coef = math.multiply(math.multiply(math.inv(math.multiply(math.transpose(X), X)), math.transpose(X)), y)
  return(Math.abs((coef[2]*(x[0]-x[x.length-1]) / (coef[2]*(x[0]+x[x.length-1])+coef[1])*100).toFixed(2)))+"%"
}

function csvToArray(str, delimiter = ",") {
  // slice from start of text to the first \n index
  // use split to create an array from string by delimiter
  const headers = str.slice(0, str.indexOf("\n")).split(delimiter);

  // slice from \n index + 1 to the end of the text
  // use split to create an array of each csv value row
  const rows = str.slice(str.indexOf("XYDATA\n")+1, str.indexOf("\n\n")).split("\n");

  // Map the rows
  // split values from each row into an array
  // use headers.reduce to create an object
  // object properties derived from headers:values
  // the object passed as an element of the array
  const x = rows.map(function (row) {
    const values = row.split(delimiter);
    return values[0];
  });
  
  const y = rows.map(function (row) {
    const values = row.split(delimiter);
    return values[1];
  });
  const arr = {x:x,
	y:y};

  // return the array
  return arr;
}

function successFunction(data) {
  var allRows = data.split(/\r?\n|\r/);
  var record = false
  var x = []
  var y = []
  for (var singleRow = 0; singleRow < allRows.length; singleRow++) {
    var rowCells = allRows[singleRow].split(',');
	if (allRows[singleRow]==""){
		record = false;
	}
	if (record){
		x.push(parseFloat(rowCells[0]));
		y.push(parseFloat(rowCells[1]));
	}
	if (rowCells[0] == "XYDATA"|rowCells[0]=="s."){
		record = true;
	}
  }
  arrayRes = {x:x,
  y:y}
  return(arrayRes)
}
