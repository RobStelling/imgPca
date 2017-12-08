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

  d3.select(".restartButton").transition().duration(1000).style("top", "820px");
  d3.select(".percentage").transition().duration(1000).style("top", "820px");
  d3.select(".percentageValue").transition().duration(1000).style("top", "820px");
  d3.select(".featureCount").transition().duration(1000).style("top", "820px");
  d3.select(".featureSigma").transition().duration(1000).style("top", "820px");
}
var contents;

function ready(event) {
  d3.select("#st1").text("Reading file...done.");
  contents = event.target.result;
  window.requestAnimationFrame(drawOriginal);
}

function drawOriginal() {
  d3.select("#st1").html("<center>Original data</center>");
  contents = text2Matrix(contents); // The result is a [m][n] matrix
  cPaint(contents, "#fOriginal", 20, 4);
  window.requestAnimationFrame(drawNormalized);
}
  
function drawNormalized() {
  d3.select("#st2").style("display", "inline").text("Normalizing data..");
  var results = normalize(contents);
  contents = results.data;
  d3.select("#st2").html("<center>Normalized data</center>");
  cPaint(contents, "#fNormalized", 20, 4);
  d3.select("#st3").style("display", "inline").text("Starting PCA. This might take a while...");
  window.requestAnimationFrame(doPca);
}

var svd;
function doPca() {
  svd = calcSvd(contents);
  const svdSLenght = svd.S.length;
  d3.select("#st4").style("display", "inline").html("<center>Main eigenvectors</center>");
  cPaint(numeric.transpose(svd.U), "#eigenVectors", 9, 8);
  var sDiagonal = [], sum = 0;

  for(let i = 0; i<svdSLength; i++) {
    sDiagonal.push({pca:svd.S[i], x: i+1});
    sum += svd.S[i];
  }

  for(let i = 0, cumulative = 0; i<sDiagonal.length; i++) {
    sDiagonal[i].percentage = sDiagonal[i].pca / sum;
    cumulative += sDiagonal[i].percentage;
    sDiagonal[i].cumulative = cumulative;
  }

  // Fits projection to SVG size
  const domainX = [-1, sDiagonal.length+2],
        domainY = [-1, sDiagonal[0].pca*1.01];

  draw(domainX, domainY, sDiagonal);
}

function text2Matrix(data) {
  // This version assumes input from Octave
  // Files start with 5 comment lines
  // and end with 3 blank lines
  // Every line starts with a space and numbers are 
  // separated by spaces
  var matrix = data.split("\n");
  // Throw away the first 5 and the last 3 lines
  matrix = matrix.slice(5,-3);

  for (let i = 0; i<matrix.length; i++)
    matrix[i] = matrix[i].split(" ");

  // Throws away the first column of every line
  // and converts every data point to numeric
  for (let i = 0; i<matrix.length; i++) {
    matrix[i] = matrix[i].slice(1);
    for(let j = 0; j<matrix[i].length; j++)
      matrix[i][j] = +matrix[i][j];
  }
  return matrix;
}

function normalize(matrix) {
  var sigma;
  matrix = diffMV(matrix, avgM(matrix));
  matrix = divideMV(matrix, sigma = stdM(matrix));

  return({data:matrix, sigma:sigma});
}

function avgM(matrix) {
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

function diffMV(matrix, vector) {
  const lines = matrix.length;
  const columns = vector.length;

  for(let i = 0; i<lines; i++) {
    for(let j = 0; j<columns; j++)
      matrix[i][j] -= vector[j];
  }
  return matrix;
}

function divideMV(matrix, vector) {
  const lines = matrix.length;
  const columns = vector.length;

  for(let i = 0; i<lines; i++) {
    for(let j = 0; j<columns; j++)
      matrix[i][j] /= vector[j];
  }
  return matrix;
}

function stdM(matrix) {
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

function minV(vector) {
  var min = Infinity;
  const length = vector.length;
  for(let i=0;i<length;i++)
    min = Math.min(min, vector[i]);
  return min;
}

function maxV(vector) {
  var max = -Infinity;
  const length = vector.length;
  for(let i=0;i<length;i++)
    max = Math.max(max, vector[i]);
  return max;
}

function calcSvd(matrix) {
  const m = matrix.length;
  const matrixT = numeric.transpose(matrix);
  var Cv = numeric.dot(matrixT, matrix);
  Cv = numeric.mul(Cv, 1/m);
  return numeric.svd(Cv);
}