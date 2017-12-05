// Reads PCA Data
function readTextFile(event) {
  var file = event.target.files[0];
  if (!file)
    return;
  var reader = new FileReader();

  reader.onload = ready;

  reader.readAsText(file);

  d3.select(".inputButtons").style("display", "none");
  d3.selectAll(".hidden").style("display", "inline");
  d3.selectAll(".hidden").classed("hidden", false);
  d3.select(".inputButtons").classed("hidden", true);

  function ready(event) {
    const contents = event.target.result.split("\n");
    var sDiagonal = [], sum = 0;

    for(let i = 1, j = 1; i<contents.length; i++) {
      // Ignores blank lines and comments
      if (contents[i] != "" && contents[i][0] != "#") {
        sDiagonal.push({pca:+contents[i], x: j++});
        sum += sDiagonal[j-2].pca;
      }
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
