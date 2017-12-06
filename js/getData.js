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
    paint(contents, [-127.87, 127.13]);
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

function paint(data, domain)
{
  // Every data line is an square image
  // Each pixel will be displayed in grayscale as in
  // RGB(colorScale(data[i][j]), colorScale(data[i][j]), colorScale(data[i][j])

  const colorScale = d3.scaleLinear().domain(domain).range([0,255]);
  const imgSize = Math.sqrt(data[0].length);
  const img = d3.select("#img");
  const viewBox = img.attr("viewBox").split(" ");
  const width = +viewBox[2], height = +viewBox[3]; 
  var rectSize = 3;
  var xOffset, yOffset;
  var columns, lines, numFaces;

  columns = Math.floor(width/(imgSize*rectSize));
  rectSize = width/(columns*imgSize);
  lines = Math.floor(height/(imgSize*rectSize));
  numFaces = columns * lines;

  img.style("display", "inline");
  // At this point we are displaying just one image,
  // for testing purposes
  for (let i = 0; i<numFaces; i++) {
    xOffset = (i%columns)*imgSize*rectSize;
    yOffset = Math.floor(i/columns)*imgSize*rectSize;
    img.selectAll("faces")
       .data(data[i])
       .enter()
       .append("rect")
       .attr("class", "faces img"+i)
       .attr("x", function(d, i){return xOffset+(Math.floor(i/imgSize))*rectSize;})
       .attr("y", function(d, i){return yOffset+(i % imgSize)*rectSize;})
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
