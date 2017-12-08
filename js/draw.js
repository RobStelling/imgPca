//var zoomK = 1;
function cPaint(faces, canvasID, columns, lines) {
      // Following this idea: https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
      // and this http://bl.ocks.org/biovisualize/5400576
    const nImages = columns*lines;
    const imgSize = Math.sqrt(faces[0].length);
    const width = columns*imgSize;
    const height = lines*imgSize;
    const colorScale = d3.scaleLinear().range([0,255]);

    var min = Infinity, max = -Infinity;
    for (let i=0; i<nImages; i++) {
      min = Math.min(min, minV(faces[i]));
      max = Math.max(max, maxV(faces[i]));
    }

    colorScale.domain([min, max]);

    var dataset = d3.range(width).map(function(d, i){return d3.range(width).map(function(d, i){return ~~(Math.random()*255);});});

    var canvas = d3.select(canvasID)
    //    .append('canvas')
        //.style("position", "absolute")
        .style("width", width + 'px')
        .style("height", height + 'px')
        //.transition().duration(1500)
        .attr("width", width)
        .attr("height", height)
        .node();

    var ctx = canvas.getContext('2d');
    var imageData = ctx.getImageData(0, 0, width, height);

    var buf = new ArrayBuffer(imageData.data.length);
    var buf8 = new Uint8ClampedArray(buf);
    var data = new Uint32Array(buf);

    for (var y = 0; y < height; ++y) {
        for (var x = 0; x < width; ++x) {
          var xFaces = Math.floor(y/32)*columns+Math.floor(x/32)%32,
              yFaces = (x%32)*32+y%32;
          var value = colorScale(faces[xFaces][yFaces]);
          //var value = dataset[y][x];
          //console.log(x, y, value);
          data[y * width + x] =
              (255   << 24) |    // alpha
              (value << 16) |    // blue
              (value <<  8) |    // green
              (value);            // red
        }
    }

    imageData.data.set(buf8);

    ctx.putImageData(imageData, 0, 0);
}


function paint(data, startLine)
{
  // Every data line is an square image
  // Each pixel will be displayed in grayscale as in
  // RGB(colorScale(data[i][j]), colorScale(data[i][j]), colorScale(data[i][j])

  const colorScale = d3.scaleLinear().range([0,255]);
  const imgSize = Math.sqrt(data[0].length);
  const img = d3.select("#img");
  const viewBox = img.attr("viewBox").split(" ");
  const width = +viewBox[2], height = +viewBox[3]; 
  var rectSize = 1;
  var xOffset, yOffset;
  var columns, lines, numFaces;
  var text = d3.select("#statusText").text();
  var yStart;

  columns = Math.floor(width/(imgSize*rectSize));
  rectSize = width/(columns*imgSize);
  lines = Math.floor(height/(imgSize*rectSize));
  numFaces = columns*lines;
  yStart = startLine*imgSize*rectSize;

  img.style("display", "inline");
  d3.select("#statusText").text(text+" First "+(lines*columns)+" images...");


  // At this point we are displaying just one image,
  // for testing purposes
  for (let i = 0; i<numFaces; i++) {
    min = minV(data[i]);
    max = maxV(data[i]);
    colorScale.domain([min,max]);
    xOffset = (i%columns)*imgSize*rectSize;
    yOffset = Math.floor(i/columns)*imgSize*rectSize;
    img.selectAll("faces")
       .data(data[i])
       .enter()
       .append("rect")
       .attr("class", "faces img"+i)
       .attr("x", function(d, i){return xOffset+(Math.floor(i/imgSize))*rectSize;})
       .attr("y", function(d, i){return yStart+yOffset+(i % imgSize)*rectSize;})
       .attr("width", rectSize)
       .attr("height", rectSize)
       .style("stroke-width", 0)
       .style("fill",
          function(d, i){
            var grayScale = Math.floor(colorScale(d));
            var color =  "rgb("+grayScale+","+grayScale+","+grayScale+")";
            return color;
          });
  }

  return;
}

function draw(domainX, domainY, data) {
    //console.log(domainX, domainY)

    // ViewBox "0 0 width height"
    var dim = d3.select("#graph").style("display", "inline").attr("viewBox").split(" ");
    var width = +dim[2],            // Uses the full width
        height = +dim[3]+(+dim[1])-50;        // but gives 50 lines 
    const pcaStrokeWidth = 0.25;

    var x = d3.scaleLinear()
        .domain(domainX)
        .range([0, width]);

    var y = d3.scaleLinear()
        .domain(domainY)
        .range([height, 0]);

    var xAxis = d3.axisBottom(x)
        .ticks((width + 2) / (height + 2) * 10)
        .tickSize(height)
        .tickPadding(8 - height);

    var yAxis = d3.axisRight(y)
        .ticks(20)
        .tickSize(width)
        .tickPadding(8 - width);

    var pcaCurve = d3.area()
        .x(function(d) { return x(d.x); })
        .y(function(d) { return y(d.pca); })
        .y1(function(d) { return y(0); });

    var svg = d3.select("#graph");

    var zoom = d3.zoom()
        .scaleExtent([1, 80])
        .translateExtent([[-100, -100], [width + 90, height + 100]])
        .on("zoom", zoomed);

    var view = svg.append("rect")
        .attr("class", "view")
        .attr("x", 0.5)
        .attr("y", 0.5)
        .attr("width", width - 1)
        .attr("height", height - 1);
    /*
    var bar = svg.append("line")
        .attr("x1", x(10))
        .attr("x2", x(10))
        .attr("y1", y(10))
        .attr("y2", y(0))
        .style("stroke-width", "5px")
        .style("stroke", "red");
     */

    var pcaLine = svg.append("path")
          .datum(data)
          //.attr("fill", "black")
          //.style("opacity", 0.5)
          .attr("stroke", "#1f78b4")
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("stroke-width", pcaStrokeWidth)
          .attr("d", pcaCurve)
          .attr("class", "pcaLine");

    var gX = svg.append("g")
        .attr("class", "axis axis--x")
        .call(xAxis);

    var gY = svg.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis);

    d3.select("#st3").text("PCA Analysis")
    change();

    d3.select(".restartButton")
        .on("click", restart);
    d3.select(".percentage")
        .on("change", change);

    hookToolTip();

    svg.call(zoom);

    function zoomed() {
      view.attr("transform", d3.event.transform);
      pcaLine.attr("transform", d3.event.transform).style("stroke-width", pcaStrokeWidth/Math.sqrt(d3.event.transform.k));
      d3.selectAll("rect").style("stroke-width", 1/Math.sqrt(d3.event.transform.k));
      gX.call(xAxis.scale(d3.event.transform.rescaleX(x)));
      gY.call(yAxis.scale(d3.event.transform.rescaleY(y)));
      //zoomK = d3.event.transform.k;
    }

    function restart() {
      svg.transition()
          .duration(750)
          .call(zoom.transform, d3.zoomIdentity);
    }

    function change() {
        var percentageValue = +d3.select(".percentage")._groups[0][0].value;
        d3.select(".percentageValue").text(percentageValue.toLocaleString("en", {minimumFractionDigits: 3, maximumFractionDigits: 3})+"%");

        var fcount = data.length;
        for(let i = 0; i < data.length; i++) {
            if (data[i].cumulative >= percentageValue/100) {
                fcount = i;
                break;
            }
        }
        d3.select(".featureCount").text(fcount);
        d3.select(".featureSigma").text(data[fcount-1].pca.toLocaleString("en", {minimumFractionDigits: 4, maximumFractionDigits: 4}))        
    }

    function hookToolTip() {
        d3.select("#graph")
          .on("mouseover", function (){
            //console.log("entrou", d3.event, zoomK);
          })
          .on("mousemove", function() {
            //console.log(d3.event);
          })
          .on("mouseout", function(){
            //console.log("saiu", d3.event, zoomK);
          });
    }
}