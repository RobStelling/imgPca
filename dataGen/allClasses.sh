#!/bin/csh
# This batch must be run on CIFAR-10 folder where all data batch
# files are located.
# Assumes dataConv.m and cifar2Gray.m are on the same folder
# and octave is on the PATH.
#
# Generates one file with $1 lines
# output file is: cif_{#lines}.dat

# Basic parameter check
if ($#argv != 1) then
	echo "Usage: $0 <# of lines>"
	exit -1
endif

set test = `echo $1 | grep '^[0-9]*$'`
if (!($test) || ($test == 0)) then
	echo "<# of lines> ($1) must be a positive integer"
	exit -2
endif

# Generate a file with #_of_lines from all classes (0-9)
echo "Generating file..."
octave dataConv.m $1 -1 > "cif_${1}.dat"
