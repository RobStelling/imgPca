#!/bin/csh
# This batch must be run on CIFAR-10 folder
# assumes dataConf.m and genData.m are on the same folder
# and octave is on the PATH
set i = 0
echo "Generating files..."
while ($i < 10)
  echo "Class $i"
  octave dataConv.m 4000 $i > "cif_c${i}_4k.dat"
  @ i = $i + 1
end
