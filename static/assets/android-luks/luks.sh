CONTAINER=/storage/3261-6631/luks.img

set -e

# Check if root
if [ $(id -u) != 0 ]; then
   echo "Aborting: This script needs root."
   exit 1
fi

# Try to open container
if [ ! -b /dev/mapper/luks ]; then
   echo "Opening luks container: $CONTAINER"
   cryptsetup open $CONTAINER luks
else
   echo "Container already open, skipped cryptsetup..."
fi

# Mounting
echo "Entering namespace of init process"
SH_PATH=$(dirname "$0")
nsenter -t 1 -m bash < $SH_PATH/mounts.sh

echo "DONE"