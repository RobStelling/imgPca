// Reads PCA Data

var getData = {};                 // Global getData object
/*
 * getData.contents:              // Data contents - Original data after normalization
 * getData.svd:                   // Svd decomposition of Covariance Matrix
 * getData.maxWidth:              // Maximum width for the image + eigenvector canvases
 * getData.maxImgSpace:           // Images will ocupy no more than that much of maxWidth
 * getData.imgSpace:              // Real width of the image canvas (#columns * dataWidth)
 * getData.eigenSpace:            // Width available for eigenvectors (maxWidth - imgSpace)
 * getData.dataWidth:             // Width of the square images (sqrt(images.length))
 * getData.canView:               // Tells if viewImage can be called at this moment
 * getData.numImg:                // Number of images on the original/projected canvas
 * getData.gpu:                   // GPU space for computations
 */
 getData.contents = "";
 getData.maxWidth = +(d3.select("#graph").style("display", "inline").attr("viewBox").split(" ")[2])+50;
 getData.maxImgSpace = 0.70;
 getData.canView = true;
 getData.viewValue = 0;
 getData.gpu = new GPU();

// Called when a file is selected
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
  getData.contents = event.target.result;
  // Starts a chain of requestAnimationFrame to
  // make sure updates will show up on the browser
  window.requestAnimationFrame(drawOriginal);
}
/*
 * Draws original images
 */
function drawOriginal() {
  d3.select("#st1").html("<center>Original data</center>");
  getData.contents = text2Matrix(getData.contents); // The result is a [m][n] matrix
  getData.dataWidth = Math.sqrt(getData.contents[0].length);
  const columns = Math.floor((getData.maxWidth*getData.maxImgSpace)/getData.dataWidth);
  getData.imgSpace = columns * getData.dataWidth;
  getData.eigenSpace = getData.maxWidth - getData.imgSpace - (getData.maxWidth - getData.imgSpace)%getData.dataWidth;
  cPaint(getData.contents, "#fOriginal", columns, 4);
  getData.numImg = columns * 4;
  window.requestAnimationFrame(drawNormalized);
}
/*
 * Draws normalized data
 */
function drawNormalized() {
  d3.select("#st2").style("display", "inline").text("Normalizing data..");
  var results = normalize(getData.contents);
  getData.contents = results.data;
  d3.select("#st2").html("<center>Normalized data</center>");
  cPaint(getData.contents, "#fNormalized", Math.floor(getData.imgSpace/getData.dataWidth), 4);
  d3.select("#st3").style("display", "inline").text("Deploying PCA. This will take a while...");
  window.requestAnimationFrame(doPca);
}
/*
 * Calculates PCA, displays eigenvectors and PCA results
 * Uses numeric Library to transpose U matrix
 */
function doPca() {
  getData.svd = calcSvd(getData.contents);
  const svdSLength = getData.svd.S.length;
  d3.select("#st4").style("display", "inline").html("<center>Main eigenimages</center>");
  cPaint(numeric.transpose(getData.svd.U), "#eigenImages", Math.floor(getData.eigenSpace/getData.dataWidth), 8);
  var sDiagonal = [], sum = 0;

  for(let i = 0; i<svdSLength; i++) {
    sDiagonal.push({pca:getData.svd.S[i], x: i+1});
    sum += getData.svd.S[i];
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
  // IMPORTANT: This code assumes that the data may have
  // comments (lines starting with #), columns (features)
  // are separated by spaces and samples are separated by \n
  // As in the example below with
  //   5 comments at start,
  //   3 data lines with 4 features each
  //   1 comment at the end
/*
# Created by Octave 4.2.1, Thu Jan 04 10:31:44 2018 -02 <stelling@Felix-Sonnenfeld.local>
# name: n_data4k_rot
# type: uint8 matrix
# ndims: 2
# 4000 1024
10 247 20 73
255 42 242 246
142 241 127 21
# Another comment
*/

  var matrix = data.split("\n");

  // Deletes comments and splits the data contents, assume space between data points
  // and converts strings to numbers

  for (let i = 0; i<matrix.length; i++) {
    // Deletes all blank and comment lines
    while (matrix[i] != undefined && (matrix[i].length == 0 || matrix[i][0] == "#"))
      matrix.splice(i, 1);
    if (i < matrix.length) {
      matrix[i] = matrix[i].split(" ");
      for (let j = 0; j<matrix[i].length; j++)
        matrix[i][j] = +matrix[i][j];
    }
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
  const m = matrix.length,
        n = matrix[0].length;
  // Computes the covariance matrix on the GPU
  // Cv = (matrixT * matrix) / m (Cv = (NxM*MxN)/Scalar = NxN matrix)
  // m = # samples
  const coVM = getData.gpu.createKernel(function(a) {
    var sum = 0;
    for (var i = 0; i < this.constants.size; i++) {
      sum += a[i][this.thread.x] * a[i][this.thread.y];
    }
    return sum/this.constants.size;
  }, {
  constants: { size: m }
  }).setOutput([n, n])
    .setOutputToTexture(false);
  // Code before kernal
  //const matrixT = numeric.transpose(matrix);
  //var Cv = numeric.dot(matrixT, matrix);
  //Cv = numeric.mul(Cv, 1/m);
  var Cv = coVM(matrix);
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
 * Called when the range slider changes
 * Displays the first getData.numImg images projected to the new space
 * and then recovered back to the original space
 * canView forces a delay between calls. This is used
 * to prevent a flood of calls when the range bar slides
 */
function viewImage() {
  if (!getData.canView)
    return;
  var features = +d3.select(".featureCount").text();
  if (features == getData.viewValue)
    return;
  getData.canView = false;
  setTimeout(function(){getData.canView = true;}, 1500);
  getData.viewValue = features;
  d3.select("#st1").html("<center>Recovered images with "+features+" features</center>");
  // Projects the first getData.numImg images with #features and recovers the data to the original data space
  cPaint(recover(projectData(getData.contents, getData.numImg, getData.svd.U, features), getData.svd.U), "#fOriginal", Math.floor(getData.imgSpace/getData.dataWidth), 4);
}