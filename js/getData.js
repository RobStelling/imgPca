// Reads PCA Data
function readTextFile(event) {
  var file = event.target.files[0];
  if (!file)
    return;
  var reader = new FileReader();

  reader.onload = ready;

  d3.select("#statusText").style("display", "inline").text("Reading file...");
  reader.readAsText(file);

  d3.select(".inputButtons").style("display", "none");
  d3.select("label").style("display", "none");
  //d3.selectAll(".hidden").style("display", "inline");
  //d3.selectAll(".hidden").classed("hidden", false);
  //d3.select(".inputButtons").classed("hidden", true);


  function ready(event) {

    // This version assumes input from Octave
    // Files start with 5 comment lines
    // and end with 3 blank lines
    // Every line starts with a space and numbers are 
    // separated by spaces

    d3.select("#statusText").text("Converting data...")
    // First splits all lines
    var contents = event.target.result.split("\n");
    for (let i = 0; i<contents.length; i++)
      contents[i] = contents[i].split(" ");

    // Throw away the first 5 and the last 3 lines
    contents = contents.slice(5,-3);

    // Throws away the first column of every line
    // and converts every data point to integer
    for (let i = 0; i<contents.length; i++) {
      contents[i] = contents[i].slice(1);
      for(let j = 0; j<contents[i].length; j++)
        contents[i][j] = +contents[i][j];
    }
    // The result is a [m][n] matrix
    d3.select("#statusText").text("Ready to visualize");
    // Assumes original data on the [-127.87, 127.13] domain
    paint(contents, [-127.87, 127.13], 10);
    return;
    var sDiagonal = [], sum = 0;

    for(let i = 0; i<contents.length; i++) {
      sDiagonal.push({pca:contents[i][0], x: i+1});
      sum += contents[i][0];
    }

    for(let i = 0, cumulative = 0; i<sDiagonal.length; i++) {
      sDiagonal[i].percentage = sDiagonal[i].pca / sum;
      cumulative += sDiagonal[i].percentage;
      sDiagonal[i].cumulative = cumulative;
    }

    //console.log(sDiagonal);
    // Fits projection to SVG size
    //console.log(sDiagonal[0], sDiagonal[sDiagonal.length-1], sDiagonal.length);
    const domainX = [-1, sDiagonal.length+2],
          domainY = [-1, sDiagonal[0].pca*1.01];

    //console.log(sDiagonal);
    draw(domainX, domainY, sDiagonal);
  }
}

function paint(data, domain, num)
{
  // Every data line is an square image
  // Each pixel will be displayed in grayscale as in
  // RGB(colorScale(data[i][j]), colorScale(data[i][j]), colorScale(data[i][j])

  var colorScale = d3.scaleLinear().domain(domain).range([0,255]);
  var imgSize = Math.sqrt(data[0].length);
  var img = d3.select("#img");
  var rectSize = 2;

  img.style("display", "inline");
  // At this point we are displaying just one image,
  // for testing purposes
  img.selectAll("rect")
     .data(data[0])
     .enter()
     .append("rect")
     .attr("x", function(d, i){return (Math.floor(i/imgSize))*rectSize;})
     .attr("y", function(d, i){return (i % imgSize)*rectSize;})
     .attr("width", rectSize)
     .attr("height", rectSize)
     .style("stroke-width", 0)
     .style("fill",
        function(d, i){
          var grayScale = Math.floor(colorScale(d));
          var color =  "rgb("+grayScale+","+grayScale+","+grayScale+")";
          return color;
        });

  return;
}
