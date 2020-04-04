---
title: "LUKS2 Encrypted Container on Android"
layout: post
tags: android linux software encryption
---
This post describes how dm-crypt / LUKS container files can be mounted on Android, completely with the standard command line open source tools. Root permissions are required.


## Setup
```sh
pkg install root-repo
pkg install cryptsetup
```

### Container
```sh
truncate --size 5G test.img
cryptsetup luksFormat --type luks2 test.img
```

### Filesystem
#### Simple: ExFAT (recommended)
```sh
cryptsetup open test.img luks

mkfs.exfat /dev/mapper/luks
```
Note: I could not find a package in Termux that contains `mkfs.exfat`, so you have to use a desktop linux instead for this step.

#### More secure: Ext4
```sh
cryptsetup open test.img luks

pkg install e2fsprogs
mkfs.exfat /dev/mapper/luks
```

`cat /proc/filesystems`

## Shell script
```sh
set -e

if [ $(id -u) != 0 ]; then
   echo "Aborting: This script needs root."
   exit 1
fi
```

### Unlock the container
```sh
CONTAINER=/storage/3261-6631/luks.img
# Try to open container
if [ ! -b /dev/mapper/luks ]; then
   echo "Opening luks container: $CONTAINER"
   cryptsetup open $CONTAINER luks
else
   echo "Container already open, skipped cryptsetup..."
fi
```

### Mounting

```sh
echo "Entering namespace of init process"
SH_PATH=$(dirname "$0")
nsenter -t 1 -m bash < $SH_PATH/mounts.sh
```
`mounts.sh`
#### ExFAT
```sh
MOUNT=/mnt/runtime/write/emulated/0/luks
echo "Mounting to: $MOUNT"
mkdir -p $MOUNT
mount -t exfat -o context=u:object_r:sdcardfs:s0,uid=0,gid=9997,fmask=0117,dmask=0006 /dev/mapper/luks $MOUNT
```

#### EXT4
```sh
mount /dev/mapper/luks $MOUNT

chcon -R u:object_r:sdcardfs:s0 $MOUNT
chgrp -R everybody $MOUNT
chmod -R 771 $MOUNT
```



#### Bind default folders
```sh
BIND=('DCIM' 'TitaniumBackup')
cd /mnt/runtime/write/emulated/0/

for dir in ${BIND[@]}; do
   echo "Bind mounting to: $dir"
   mkdir -p $dir
   mount -o bind $MOUNT/$dir $dir
done
```

### Download
[luks.sh](/assets/android-luks/luks.sh)
[mounts.sh](/assets/android-luks/mounts.sh)

## Sources
<https://android.stackexchange.com/questions/194651/why-bind-mounts-in-storage-emulated-0-are-not-visible-in-apps>
<https://source.android.com/devices/storage/#runtime_permissions>

<https://android.stackexchange.com/questions/217741/how-to-bind-mount-a-folder-inside-sdcard-with-correct-permissions/217936#217936>

Android Security Internals:
<https://books.google.de/books?id=y11NBQAAQBAJ&pg=PA108&lpg=PA108&dq=zygote+namespace&source=bl&ots=nV_zzQvX3z&sig=ACfU3U0rBLpGYslPzvwECRr1rPu4nOgVzw&hl=en&sa=X&ved=2ahUKEwjZ8sPKm5joAhXYRBUIHRWuD1QQ6AEwBXoECAoQAQ#v=onepage&q=namespace&f=false>

<https://nelenkov.blogspot.com/2015/06/decrypting-android-m-adopted-storage.html>

## Further reading
Mount namespaces and shared subtrees
<https://lwn.net/Articles/689856/>

Mount namespaces, mount propagation, and unbindable mounts
<https://lwn.net/Articles/690679/>