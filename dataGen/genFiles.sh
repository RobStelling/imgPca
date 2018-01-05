#!/bin/csh
# This batch must be run on CIFAR-10 folder where all data batch
# files are located
# Assumes dataConv.m and genData.m are on the same folder
# and octave is on the PATH

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

# Generate data for all classes (0-9)
set i = 0
echo "Generating files..."
while ($i < 10)
  echo "Class $i"
  octave dataConv.m $1 $i > "cif_c${i}_${1}.dat"
  @ i = $i + 1
end