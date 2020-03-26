MOUNT=/mnt/runtime/write/emulated/0/luks
BIND=('DCIM' 'TitaniumBackup')

set -e

echo "Mounting to: $MOUNT"
mkdir -p $MOUNT
mount -t exfat -o context=u:object_r:sdcardfs:s0,uid=0,gid=9997,fmask=0117,dmask=0006 /dev/mapper/luks $MOUNT
echo "Mount done!"

cd /mnt/runtime/write/emulated/0/
for dir in ${BIND[@]}; do
   echo "Bind mounting to: $dir"
   mkdir -p $dir
   mount -o bind $MOUNT/$dir $dir
done
