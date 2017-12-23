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
  getData.eigenSpace = getData.maxWidth - getData.imgSpace - 1;
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
  d3.select("#st4").style("display", "inline").html("<center>Main eigenvectors</center>");
  cPaint(numeric.transpose(getData.svd.U), "#eigenVectors", Math.floor(getData.eigenSpace/getData.dataWidth), 8);
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
  const m = matrix.length,
        n = matrix[0].length;
  // Computes the covariance matrix on the GPU
  // Cv = matrixT * matrix / m
  // m = # samples
  // Need to replace 5000 to m on the code below
  const coVM = getData.gpu.createKernel(function(a, m) {
    var sum = 0;
    for (var i = 0; i < 5000; i++) {
      sum += a[i][this.thread.x] * a[i][this.thread.y];
    }
    return sum/m;
  })
    .setOutput([n, n])
    .setOutputToTexture(false);
  //const matrixT = numeric.transpose(matrix);
  //var Cv = numeric.dot(matrixT, matrix);
  //Cv = numeric.mul(Cv, 1/m);
  var Cv = coVM(matrix, m);
  return GPUsvd(Cv);
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

/*
 * SVD decomposition
 */
function GPUsvd(A) {
    var temp;
//Compute the thin SVD from G. H. Golub and C. Reinsch, Numer. Math. 14, 403-420 (1970)
  var prec= numeric.epsilon; //Math.pow(2,-52) // assumes double prec
  var tolerance= 1.e-64/prec;
  var itmax= 50;
  var c=0;
  var i=0;
  var j=0;
  var k=0;
  var l=0;
  
  var u= numeric.clone(A);
  var m= u.length;
  
  var n= u[0].length;
  
  if (m < n) throw "Need more rows than columns"
  
  var e = new Array(n);
  var q = new Array(n);
  for (i=0; i<n; i++) e[i] = q[i] = 0.0;
  var v = numeric.rep([n,n],0);
//  v.zero();
  
  function pythag(a,b)
  {
    a = Math.abs(a)
    b = Math.abs(b)
    if (a > b)
      return a*Math.sqrt(1.0+(b*b/a/a))
    else if (b == 0.0) 
      return a
    return b*Math.sqrt(1.0+(a*a/b/b))
  }

  //Householder's reduction to bidiagonal form

  var f= 0.0;
  var g= 0.0;
  var h= 0.0;
  var x= 0.0;
  var y= 0.0;
  var z= 0.0;
  var s= 0.0;
  
  for (i=0; i < n; i++)
  { 
    e[i]= g;
    s= 0.0;
    l= i+1;
    for (j=i; j < m; j++) 
      s += (u[j][i]*u[j][i]);
    if (s <= tolerance)
      g= 0.0;
    else
    { 
      f= u[i][i];
      g= Math.sqrt(s);
      if (f >= 0.0) g= -g;
      h= f*g-s
      u[i][i]=f-g;
      for (j=l; j < n; j++)
      {
        s= 0.0
        for (k=i; k < m; k++) 
          s += u[k][i]*u[k][j]
        f= s/h
        for (k=i; k < m; k++) 
          u[k][j]+=f*u[k][i]
      }
    }
    q[i]= g
    s= 0.0
    for (j=l; j < n; j++) 
      s= s + u[i][j]*u[i][j]
    if (s <= tolerance)
      g= 0.0
    else
    { 
      f= u[i][i+1]
      g= Math.sqrt(s)
      if (f >= 0.0) g= -g
      h= f*g - s
      u[i][i+1] = f-g;
      for (j=l; j < n; j++) e[j]= u[i][j]/h
      for (j=l; j < m; j++)
      { 
        s=0.0
        for (k=l; k < n; k++) 
          s += (u[j][k]*u[i][k])
        for (k=l; k < n; k++) 
          u[j][k]+=s*e[k]
      } 
    }
    y= Math.abs(q[i])+Math.abs(e[i])
    if (y>x) 
      x=y
  }
  
  // accumulation of right hand gtransformations
  for (i=n-1; i != -1; i+= -1)
  { 
    if (g != 0.0)
    {
      h= g*u[i][i+1]
      for (j=l; j < n; j++) 
        v[j][i]=u[i][j]/h
      for (j=l; j < n; j++)
      { 
        s=0.0
        for (k=l; k < n; k++) 
          s += u[i][k]*v[k][j]
        for (k=l; k < n; k++) 
          v[k][j]+=(s*v[k][i])
      } 
    }
    for (j=l; j < n; j++)
    {
      v[i][j] = 0;
      v[j][i] = 0;
    }
    v[i][i] = 1;
    g= e[i]
    l= i
  }
  
  // accumulation of left hand transformations
  for (i=n-1; i != -1; i+= -1)
  { 
    l= i+1
    g= q[i]
    for (j=l; j < n; j++) 
      u[i][j] = 0;
    if (g != 0.0)
    {
      h= u[i][i]*g
      for (j=l; j < n; j++)
      {
        s=0.0
        for (k=l; k < m; k++) s += u[k][i]*u[k][j];
        f= s/h
        for (k=i; k < m; k++) u[k][j]+=f*u[k][i];
      }
      for (j=i; j < m; j++) u[j][i] = u[j][i]/g;
    }
    else
      for (j=i; j < m; j++) u[j][i] = 0;
    u[i][i] += 1;
  }
  
  // diagonalization of the bidiagonal form
  prec= prec*x
  for (k=n-1; k != -1; k+= -1)
  {
    for (var iteration=0; iteration < itmax; iteration++)
    { // test f splitting
      var test_convergence = false
      for (l=k; l != -1; l+= -1)
      { 
        if (Math.abs(e[l]) <= prec)
        { test_convergence= true
          break 
        }
        if (Math.abs(q[l-1]) <= prec)
          break 
      }
      if (!test_convergence)
      { // cancellation of e[l] if l>0
        c= 0.0
        s= 1.0
        var l1= l-1
        for (i =l; i<k+1; i++)
        { 
          f= s*e[i]
          e[i]= c*e[i]
          if (Math.abs(f) <= prec)
            break
          g= q[i]
          h= pythag(f,g)
          q[i]= h
          c= g/h
          s= -f/h
          for (j=0; j < m; j++)
          { 
            y= u[j][l1]
            z= u[j][i]
            u[j][l1] =  y*c+(z*s)
            u[j][i] = -y*s+(z*c)
          } 
        } 
      }
      // test f convergence
      z= q[k]
      if (l== k)
      { //convergence
        if (z<0.0)
        { //q[k] is made non-negative
          q[k]= -z
          for (j=0; j < n; j++)
            v[j][k] = -v[j][k]
        }
        break  //break out of iteration loop and move on to next k value
      }
      if (iteration >= itmax-1)
        throw 'Error: no convergence.'
      // shift from bottom 2x2 minor
      x= q[l]
      y= q[k-1]
      g= e[k-1]
      h= e[k]
      f= ((y-z)*(y+z)+(g-h)*(g+h))/(2.0*h*y)
      g= pythag(f,1.0)
      if (f < 0.0)
        f= ((x-z)*(x+z)+h*(y/(f-g)-h))/x
      else
        f= ((x-z)*(x+z)+h*(y/(f+g)-h))/x
      // next QR transformation
      c= 1.0
      s= 1.0
      for (i=l+1; i< k+1; i++)
      { 
        g= e[i]
        y= q[i]
        h= s*g
        g= c*g
        z= pythag(f,h)
        e[i-1]= z
        c= f/z
        s= h/z
        f= x*c+g*s
        g= -x*s+g*c
        h= y*s
        y= y*c
        for (j=0; j < n; j++)
        { 
          x= v[j][i-1]
          z= v[j][i]
          v[j][i-1] = x*c+z*s
          v[j][i] = -x*s+z*c
        }
        z= pythag(f,h)
        q[i-1]= z
        c= f/z
        s= h/z
        f= c*g+s*y
        x= -s*g+c*y
        for (j=0; j < m; j++)
        {
          y= u[j][i-1]
          z= u[j][i]
          u[j][i-1] = y*c+z*s
          u[j][i] = -y*s+z*c
        }
      }
      e[l]= 0.0
      e[k]= f
      q[k]= x
    } 
  }
    
  //vt= transpose(v)
  //return (u,q,vt)
  for (i=0;i<q.length; i++) 
    if (q[i] < prec) q[i] = 0
    
  //sort eigenvalues  
  for (i=0; i< n; i++)
  {  
  //writeln(q)
   for (j=i-1; j >= 0; j--)
   {
    if (q[j] < q[i])
    {
  //  writeln(i,'-',j)
     c = q[j]
     q[j] = q[i]
     q[i] = c
     for(k=0;k<u.length;k++) { temp = u[k][i]; u[k][i] = u[k][j]; u[k][j] = temp; }
     for(k=0;k<v.length;k++) { temp = v[k][i]; v[k][i] = v[k][j]; v[k][j] = temp; }
//     u.swapCols(i,j)
//     v.swapCols(i,j)
     i = j     
    }
   }  
  }
  
  return {U:u,S:q,V:v}
};