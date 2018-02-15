% Collects nLines from CIFAR-10 files belonging do classNumber and returns
% the corresponding line-first grayscale images (using weights).
% If 0 < classNumber < 10 then collects data from that class otherwise
% collects data from all classes.
% Assumes CIFAR-10 filenames are "data_batch_{n}.mat"

function ndata = cifar2Gray(nLines, classNumber)
    i = 0; j = 1;
    baseName = 'data_batch_';
    classData = [[]];
    % Loads data from batch files until reaches the desired # of lines
    while (i < nLines)
    	load ([baseName num2str(j) '.mat']);
        if (classNumber >= 0 && classNumber < 10)
            % gets only the desired class
            classData = cat(1, classData, data(labels==classNumber, :));
        else
            % gets all classes
            classData = cat(1, classData, data);
	endif
        i = size(classData, 1);
        j++;
    endwhile
    % Converts CIFAR data to grayscale correcting for luma coefficients
    % using Rec. 709 (0.2126, 0.7152, 0.0722)
    % See https://en.wikipedia.org/wiki/Rec._709
	gs_data=classData(1:nLines,1:1024)*0.2126+classData(1:nLines,1025:2048)*0.7152+classData(1:nLines,2049:3072)*0.0722;
	% Rotates images 90 degrees clockwise
	for k = 1:nLines
	  ndata(k,:) = reshape(rot90(reshape(gs_data(k,:), 32, 32), -1), 1, []);
	endfor
endfunction
