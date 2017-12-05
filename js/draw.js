var zoomK = 1, xVal, yVal, allData;
function draw(domainX, domainY, data) {
    //console.log(domainX, domainY)

    var margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
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

    var svg = d3.select("svg");

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

    allData = data;

    xVal = x;
    yVal = y;

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
      zoomK = d3.event.transform.k;
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
        d3.select("svg")
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