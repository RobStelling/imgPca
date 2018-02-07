#!/bin/csh
# Calls multiClass.sh to generate files with
# 128, 256, 512, 1024, 2048, 4096 and 5000 images
#
# Generates one file per class (classes 0 to 9) with $1 lines
# output files are: cif_c{class#}_{#lines}.dat

if ($#argv != 0) then
	echo "Usage: $0"
	exit -1
endif

foreach i (128 256 512 1024 2048 4096 5000)
	echo "Generating files with $i images"
	./multiClass.sh $i
end