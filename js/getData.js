// Reads PCA Data

var contents;             // Data contents - Original data after normalization
var svd;                  // Svd decomposition of Covariance Matrix
const maxWidth = +(d3.select("#graph").style("display", "inline").attr("viewBox").split(" ")[2])+50;
const maxImgSpace = 0.70; // Images will ocupy no more than 75% of the SVG width
var imgSpace,             // Width available for images
    eigenSpace,           // Width available for eigenvectors -> maxWidth - imgSpace
    dataWidth;            // Width for the square images


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

  d3.selectAll(".movedown").transition().duration(1000).style("top", "820px");
}
/*
 * Callback for the file reader
 * We daisychained requestAnimationFrame with
 * ready->drawOriginal->drawNormalized->doPca
 * This could have been just one function with
 * entries depending on a state but the code
 * would be a bit more convoluted
 * ToDo: Try promises
 */
function ready(event) {
  d3.select("#st1").text("Reading file...done.");
  contents = event.target.result;
  // Starts a chain of requestAnimationFrame to
  // make sure updates will show up on the browser
  window.requestAnimationFrame(drawOriginal);
}
/*
 * Draws original images
 */
function drawOriginal() {

  d3.select("#st1").html("<center>Original data</center>");
  contents = text2Matrix(contents); // The result is a [m][n] matrix
  dataWidth = Math.sqrt(contents[0].length);
  const columns = Math.floor((maxWidth*maxImgSpace)/dataWidth);
  imgSpace = columns * dataWidth;
  eigenSpace = maxWidth - imgSpace - 1;
  cPaint(contents, "#fOriginal", columns, 4);
  window.requestAnimationFrame(drawNormalized);
}
/*
 * Draws normalized data
 */
function drawNormalized() {
  d3.select("#st2").style("display", "inline").text("Normalizing data..");
  var results = normalize(contents);
  contents = results.data;
  d3.select("#st2").html("<center>Normalized data</center>");
  cPaint(contents, "#fNormalized", Math.floor(imgSpace/dataWidth), 4);
  d3.select("#st3").style("display", "inline").text("Deploying PCA. This will take a while...");
  window.requestAnimationFrame(doPca);
}
/*
 * Calculates PCA, displays eigenvectors and PCA results
 * Uses numeric Library to transpose U matrix
 */
function doPca() {
  svd = calcSvd(contents);
  const svdSLength = svd.S.length;
  d3.select("#st4").style("display", "inline").html("<center>Main eigenvectors</center>");
  cPaint(numeric.transpose(svd.U), "#eigenVectors", Math.floor(eigenSpace/dataWidth), 8);
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
  const domainX = [-1, sDiagonal.length+1],
        domainY = [-1, sDiagonal[0].pca];

  draw(domainX, domainY, sDiagonal);

  d3.select(".viewButton")
    .on("click", viewImage);
}
/*
 * Converts text to matrix
 */
function text2Matrix(data) {
  // ALERT: This version assumes input from Octave
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
  // and converts every data point to numbers
  for (let i = 0; i<matrix.length; i++) {
    matrix[i] = matrix[i].slice(1);
    for(let j = 0; j<matrix[i].length; j++)
      matrix[i][j] = +matrix[i][j];
  }
  return matrix;
}
/*
 * Normalize a matrix
 * Assumes lines as data points, columns as features
 * Input: MxN matrix
 * Output: MxN matrix, N sigma
 */
function normalize(matrix) {
  var sigma;
  matrix = diffMV(matrix, avgM(matrix));
  matrix = divideMV(matrix, sigma = stdM(matrix));
  return({data:matrix, sigma:sigma});
}
/*
 * Calculates the vector average of a data matrix
 * Input: MxN matrix
 * Output: N average
 */
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
/*
 * Calculates the differenct between a matrix and vector
 * Input: MxN matrix, N vector
 * Output: MxN matrix
 */
function diffMV(matrix, vector) {
  const lines = matrix.length;
  const columns = vector.length;

  for(let i = 0; i<lines; i++) {
    for(let j = 0; j<columns; j++)
      matrix[i][j] -= vector[j];
  }
  return matrix;
}
/*
 * Divides a matrix by a vector
 * Input: MxN matrix, N vector
 * Output: MxN matrix
 */
function divideMV(matrix, vector) {
  const lines = matrix.length;
  const columns = vector.length;

  for(let i = 0; i<lines; i++) {
    for(let j = 0; j<columns; j++)
      matrix[i][j] /= vector[j];
  }
  return matrix;
}
/*
 * Calculates the standard deviation of the sample
 * Input: MxN matrix
 * Output: N vector
 */
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
/*
 * Returns the minimal value of a vector
 * Input: N vector
 * Output: scalar
 */
function minV(vector) {
  var min = Infinity;
  const length = vector.length;
  for(let i=0;i<length;i++)
    min = Math.min(min, vector[i]);
  return min;
}
/*
 * Returns the maximal value of a vector
 * Input: N vector
 * Output: scalar
 */
function maxV(vector) {
  var max = -Infinity;
  const length = vector.length;
  for(let i=0;i<length;i++)
    max = Math.max(max, vector[i]);
  return max;
}
/*
 * Returns the svd decomposition of the
 * covariant matrix generated by the original data
 * Input: MxN matrix
 * Output: S vector (N), U matrix NxN, V matrix NxN
 * Uses the numeric library - Todo: Try/consider other options
 */
function calcSvd(matrix) {
  const m = matrix.length;
  const matrixT = numeric.transpose(matrix);
  var Cv = numeric.dot(matrixT, matrix);
  Cv = numeric.mul(Cv, 1/m);
  return numeric.svd(Cv);
}
/*
 * Projects data to the new space based on # of features selected
 * Ex: X = 5000x1024, U = 1024x1204; Z=5000xK
 */
function projectData(data, dCount, U, fCount) {
  return numeric.dot(data.slice(0, dCount), numeric.transpose(numeric.transpose(U).slice(0, fCount)));
}
/*
 * Recovers the "original" data from the Z (data) and U matrices
 */
function recover(Z, U) {
  var features = Z[0].length;
  return numeric.dot(Z, numeric.transpose(U).slice(0, features));
}
/*
 * Called when "View" button is pressed
 * Displays the first 80 images projected to the new space
 * and then recovered back to the original space
 * canView forces a 2s delay between calls. This is used
 * to prevent a flood of calls when the range bar slides
 * but is not really necessary when the value is selected
 * with a click
 */
var canView = true;
function viewImage() {
  if (!canView)
    return;
  canView = false;
  setTimeout(function(){canView = true;}, 1500);
  var features = +d3.select(".featureCount").text();
  d3.select("#st1").html("<center>Recovered images with "+features+" features</center>");
  // Projects the first 80 images with #features and recovers the data to the original data space
  cPaint(recover(projectData(contents, 80, svd.U, features), svd.U), "#fOriginal", Math.floor(imgSpace/dataWidth), 4);
}