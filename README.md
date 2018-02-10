# imgPca
imgPca is a JavaScript application to allow the visualization of Principal Component Analysis on images. Developed for the Data Visualization program at PPGI/UFRJ.
<pre>
Roberto Stelling - 117.335.792
Universidade Federal do Rio de Janeiro
PPGI Master's Program - 3rd Term 2017
Visualização de Dados (Data Visualization) 2017/3-MAI718
</pre>
![imgPca Screenshot](../../raw/master/imgPca.png)
# What are the visuals of imgPca ?

imgPca splits the screen in two parts, the top part is used to visualize the normalized images, the converted images with the desired alpha and the eigenvectors.

The lower part is used to visually interact with the S vector and select the appropriate alpha values.
Images are recovered on the fly on the top of the screen whenever a new number of features is selected.

The plot shows *number of eigenvectors* **X** *Log10(eigenvalues)*.
