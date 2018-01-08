% Reads nLines of the desired class from CIFAR-10 batch files and returns the corresponding
% line-first grayscale images (using weights), line-first data.
% Assumes CIFAR-10 filenames are "data_batch_{n}.mat"
function ndata = genData(nLines, classNumber)
    i = 0; j = 1;
    baseName = 'data_batch_';
    classData = [[]];
    % Loads data from batch files until reaches the desired # of lines
    while (i < nLines)
    	load ([baseName num2str(j) '.mat']);
        if (classNumber >= 0 && classNumber < 10)
            classData = cat(1, classData, data(labels==classNumber, :));
        else
            classData = cat(1, classData, data);
	endif
        i = size(classData, 1);
        j++;
    endwhile
    % Converts CIFAR data to grayscale using weights for each channel (0.3, 0.59, 0.11)
	gs_data=classData(1:nLines,1:1024)*0.3+classData(1:nLines,1025:2048)*0.59+classData(1:nLines,2049:3072)*0.11;
	% Rotates images -90 degrees
	for k = 1:nLines
	  ndata(k,:) = reshape(rot90(reshape(gs_data(k,:), 32, 32), -1), 1, []);
	endfor
endfunction
