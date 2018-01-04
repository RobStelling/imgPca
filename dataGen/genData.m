% Reads nLines of the desired class from CIFAR-10 batch files and returns the corresponding
% line-first grayscale images, using luminance wheigts (0.3, 0.59, 0.11), line-first data.
% Assumes filenames are "data_batch_n.mat"
function ndata = genData(nLines, classNumber)
    i = 0; j = 1;
    baseName = 'data_batch_';
    classData = [[]];
    % Load data from batch files until reaches the desired # of lines
    while (i < nLines)
    	load ([baseName num2str(j) '.mat']);
        classData = cat(1, classData, data(labels==classNumber, :));
        i = size(classData, 1);
        j++;
    endwhile
	gs_data=classData(1:nLines,1:1024)*0.3+classData(1:nLines,1025:2048)*0.59+classData(1:nLines,2049:3072)*0.11;
	for k = 1:nLines
	  ndata(k,:) = reshape(rot90(reshape(gs_data(k,:), 32, 32), -1), 1, []);
	endfor
endfunction

printf('%d\n', argin);
printf('%s\n', argv());