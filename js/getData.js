// Reads PCA Data
function readTextFile(event) {
  var file = event.target.files[0];
  if (!file)
    return;
  var reader = new FileReader();

  reader.onload = ready;

  d3.select("#st1").style("display", "inline").text("Reading file...");
  reader.readAsText(file);

  d3.select(".inputButtons").style("display", "none");
  d3.select("label").style("display", "none");
  d3.selectAll(".hidden").style("display", "inline");
  d3.selectAll(".hidden").classed("hidden", false);
  d3.select(".inputButtons").classed("hidden", true);

  d3.select(".restartButton").transition().duration(1000).style("top", "900px");
  d3.select(".percentage").transition().duration(1000).style("top", "900px");
  d3.select(".percentageValue").transition().duration(1000).style("top", "900px");
  d3.select(".featureCount").transition().duration(1000).style("top", "900px");
  d3.select(".featureSigma").transition().duration(1000).style("top", "900px");
  
  function ready(event) {

    // This version assumes input from Octave
    // Files start with 5 comment lines
    // and end with 3 blank lines
    // Every line starts with a space and numbers are 
    // separated by spaces
    d3.select("#st1").text("Reading file...done. Converting data...");
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
    d3.select("#st1").text("Original data");
    // Assumes original data on the [-127.87, 127.13] domain
    //paint(contents, 0);
    cPaint(contents, "#fOriginal", 20, 4);
    d3.select("#st2").style("display", "inline").text("Normalizing data..");
    results = normalize(contents);
    contents = results.data;
    d3.select("#st2").text("Normalized data");
    //paint(contents, 0);
    cPaint(contents, "#fNormalized", 20, 4);
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

function normalize(data)
{
  var sigma;
  data = diffMV(data, avgM(data));
  data = divideMV(data, sigma = stdM(data));

  return({data:data, sigma:sigma});
}

function avgM(matrix)
{
  var mu = [];
  const lines = matrix.length;
  const columns = matrix[0].length;

  for(let j = 0; j<columns; j++) {
    mu.push(0)
    for(let i = 0; i<lines; i++)
      mu[j] += matrix[i][j];
  }

  for(let j = 0; j<columns; j++)
    mu[j] = mu[j]/lines;

  return mu;
}

function diffMV(matrix, vector)
{
  const lines = matrix.length;
  const columns = vector.length;

  for(let i = 0; i<lines; i++) {
    for(let j = 0; j<columns; j++)
      matrix[i][j] -= vector[j];
  }
  return matrix;
}

function divideMV(matrix, vector)
{
  const lines = matrix.length;
  const columns = vector.length;

  for(let i = 0; i<lines; i++) {
    for(let j = 0; j<columns; j++)
      matrix[i][j] /= vector[j];
  }
  return matrix;
}

function stdM(matrix)
{
  var mu = avgM(matrix);
  var std = [];
  const lines = matrix.length;
  const columns = matrix[0].length;

  for(let j = 0; j<columns; j++) {
    std.push(0);
    for(let i = 0; i<lines; i++)
      std[j] += Math.pow(matrix[i][j] - mu[j], 2);
  }

  for(let j = 0; j<columns; j++)
    std[j] = Math.sqrt(std[j]/(lines-1));

  return(std);
}

function minV(vector)
{
  var min = Infinity;
  for(let i=0;i<vector.length;i++)
    min = Math.min(min, vector[i]);
  return min;
}

function maxV(vector)
{
  var max = -Infinity;
  for(let i=0;i<vector.length;i++)
    max = Math.max(max, vector[i]);
  return max;
}