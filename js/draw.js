/*
 * Paints a sample of data images on a canvas
 * Input:
 *  data - MxN data matrix
 *  canvasId - DOM ID of the canvas where the data will be displayed
 *  columns - Number of columns
 *  lines - Number of lines
 */
function cPaint(data, canvasID, columns, lines) {
      // Write directly into the canvas
      // Following this idea: https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
      // and this http://bl.ocks.org/biovisualize/5400576
    const nImages = columns*lines;
    const imgSize = Math.sqrt(data[0].length);
    const width = columns*imgSize;
    const height = lines*imgSize;
    const colorScale = d3.scaleLinear().range([0,255]);

    var min = Infinity, max = -Infinity;
    for (let i=0; i<nImages; i++) {
      min = Math.min(min, minV(data[i]));
      max = Math.max(max, maxV(data[i]));
    }

    colorScale.domain([min, max]);

    var canvas = d3.select(canvasID)
        .style("width", width + 'px')
        .style("height", height + 'px')
        .attr("width", width)
        .attr("height", height)
        .node();

    var ctx = canvas.getContext('2d');
    var imageData = ctx.getImageData(0, 0, width, height);

    var buf = new ArrayBuffer(imageData.data.length);
    var buf8 = new Uint8ClampedArray(buf);
    var map = new Uint32Array(buf);

    for (var y = 0; y < height; ++y) {
        for (var x = 0; x < width; ++x) {
          var xData = Math.floor(y/imgSize)*columns+Math.floor(x/imgSize)%imgSize,
              yData = (x%imgSize)*imgSize+y%imgSize;
          var value = colorScale(data[xData][yData]);
          map[y * width + x] =
              (255   << 24) |    // alpha
              (value << 16) |    // blue
              (value <<  8) |    // green
              (value);           // red
        }
    }

    imageData.data.set(buf8);

    ctx.putImageData(imageData, 0, 0);
}
/*
 * Draws the interactive PCA graph
 * Todo:
 *  - Add tooltip and a locating bar
 *  - Add restore and save buttons
 */
function draw(domainX, domainY, data) {
    // Zoom behaviour based on
    // https://bl.ocks.org/mbostock/db6b4335bf1662b413e7968910104f0f

    var dim = d3.select("#graph").style("display", "inline").attr("viewBox").split(" ");
    var width = +dim[2],                      // Uses the full width but
        height = +dim[3]+(+dim[1])-50;        // doesn't use the last 50 lines 

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

    var pcaLine = svg.append("path")
          .datum(data)
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

    d3.select("#st3").text("PCA Analysis");

    change();

    d3.select(".restoreButton")
        .on("click", restore);

    d3.select(".percentage")
        .on("input", change)
        .on("change", viewImage);

    d3.select(".saveButton")
        .on("click", save);

    hookToolTip();

    svg.call(zoom);

    function zoomed() {
      view.attr("transform", d3.event.transform);
      pcaLine.attr("transform", d3.event.transform).style("stroke-width", pcaStrokeWidth/Math.sqrt(d3.event.transform.k));
      d3.selectAll("rect").style("stroke-width", 1/Math.sqrt(d3.event.transform.k));
      gX.call(xAxis.scale(d3.event.transform.rescaleX(x)));
      gY.call(yAxis.scale(d3.event.transform.rescaleY(y)));
    }

    function restore() {
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

    function save() {
      // Hides the save button
      d3.select(".saveButton").style("display", "none");
      // Stringfies and create a blob for the SVD object
      var svdData = JSON.stringify(getData.svd);
      var svdBlob = new Blob([svdData], { type: "text/plain;charset=utf-8" });
      // Creates an URL for the object
      var svdUrl = URL.createObjectURL(svdBlob);
      // Creates a temporary donwload link and deletes it after the download
      var downloadLink = document.createElement("a");
      downloadLink.href = svdUrl;
      downloadLink.download = "imgPca.json";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      // Deletes the download link
      document.body.removeChild(downloadLink);
      return;
    }

    function hookToolTip() {
        d3.select("#graph")
          .on("mouseover", function (){
            //console.log("entrou", d3.event);
          })
          .on("mousemove", function() {
            //console.log(d3.event);
          })
          .on("mouseout", function(){
            //console.log("saiu", d3.event, zoomK);
          });
    }
}