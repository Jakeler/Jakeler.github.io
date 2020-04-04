---
title: "LUKS2 Encrypted Container on Android"
layout: post
tags: android root linux software encryption
---
This post describes how dm-crypt / LUKS container files can be mounted on Android, completely with the standard command line open source tools. It is written for Android 10, but should also work on older versions. Root permissions are required.

## Setup
The builtin android `toybox` does not include the required tools. Instead I recommend using [Termux](https://f-droid.org/en/packages/com.termux/), a Terminal emulator app with an extensive package collection. So open Termux and execute:
```sh
pkg install root-repo
pkg install cryptsetup tsu
```
This enables the repository containing root packages and installs the most important tools. Especially `cryptsetup` for handling the LUKS headers, `tsu` to run commands/shell as root while keeping the correct PATH to access the termux programs from `/data/data/com.termux/files/usr/bin/` easily.

After installation in Termux you can also run these binaries from another terminal emulator app or adb shell, if you prefer that. 
Following steps must be all run from a root shell (su/tsu). 

### Container
If you already have an encrypted container/partition you can just copy/connect it to the phone and skip this step. Otherwise create a empty file with `truncate` (or `dd`), you can choose any size you like, I use 5 GB here. Also don't forget to replace `test.img` with a meaningful filename or path. `/sdcard/` maps to the internal storage in `/storage/emulated/0/`, for external microSD or USB storage look in `/storage/ID/`.

```sh
cd /sdcard
truncate --size 5G test.img
cryptsetup luksFormat --type luks2 test.img
```
`cryptsetup` will ask interactively for a password.

### Filesystem
Filesystem support depends on the device kernel and can differ, use `cat /proc/filesystems` to check what is in the list. ExFAT and Ext4 should be available on almost any device though. 

Native Linux filesystems (like ext4) make it a bit more complicated, because they support unix permissions on individual files and they are set by the Android system.
Use exFAT if you want easy access to files created from other apps. This is more convenient, but if you like more security from possibly malicious apps you can use ext4 to get some sort scoped storage (from Android 11), where apps can only access files they created themselves.

#### Simple: ExFAT (recommended)
First step is to open the container with your passphrase, then simply create the fs:
```sh
cryptsetup open test.img luks

mkfs.exfat /dev/mapper/luks
```
Note: I could not find a package in Termux that contains `mkfs.exfat`, so you have to use a desktop linux instead for this step.

#### More secure: Ext4
Almost the same as with exFAT, open the container and make the fs:
```sh
cryptsetup open test.img luks

pkg install e2fsprogs
mkfs.exfat /dev/mapper/luks
```
Permissions on the mount point have to be fixed after mounting initially. Keep in mind that on Android every app runs as own user (name in `u_APPID` schema) and every file created by an app though the Android framework gets restrictive `-rwx------` permissions for group and others, so they are not visible by all other apps. You have to manually chmod/chown after creation to make them accessible if required (more on that in the mount section).


## Shell script
First the usual setup, set to abort on errors and check if we are running as root:
```sh
set -e

if [ $(id -u) != 0 ]; then
   echo "Aborting: This script needs root."
   exit 1
fi
```

### Unlock the container
Unlocking works simply with cryptsetup again, I have just added a check if the it is already open.
```sh
CONTAINER=/storage/3261-6631/luks.img

if [ ! -b /dev/mapper/luks ]; then
   echo "Opening luks container: $CONTAINER"
   cryptsetup open $CONTAINER luks
else
   echo "Container already open, skipped cryptsetup..."
fi
```

### Mounting
Because of the Android architecture a few additional steps are required to get it properly mounted. Every app has its own mount namespace, that means mount from other apps are not visible, so it would be per default only available to Termux or whatever Terminal you use and that is no good. A fix is to enter the root namespace and do it there, then the mount propagates to all child app namespaces:
```sh
echo "Entering namespace of init process"
SH_PATH=$(dirname "$0")
nsenter -t 1 -m bash < $SH_PATH/mounts.sh
```
Here `-t` specifies the target namespace, use simply PID 1, which is the init process. `-m` stands for mount namespace and then follows the command, in this case a bash shell with the commands piped into it. Instead of this extra script you can also omit the last part and type it manually into the shell.

Following commands go all into the `mounts.sh` script (must be run inside the init namespace).

Another Android specialty are the different storage views: default, read and write. They were added with Android 6 (Marshmallow) to be able to change permissions on runtime, through bind mounting the needed view into the specific app namespaces. Therefore the location is `/mnt/runtime/VIEW` and we have to mount there to make it available to the apps with correct permissions. It is enough to mount into the write view, because with the "simplified" permission model apps that got storage access granted see always this view. So to mount on the internal storage to `luks`:
```sh
MOUNT=/mnt/runtime/write/emulated/0/luks
echo "Mounting to: $MOUNT"
mkdir -p $MOUNT
```
In addition create the mount point, if it does not already exist. 
#### ExFAT
Then finally mount it like that:
```sh
mount -t exfat -o context=u:object_r:sdcardfs:s0,uid=0,gid=9997,fmask=0117,dmask=0006 /dev/mapper/luks $MOUNT
```
ExFAT does not save unix permissions or the SELinux context, so it is important to specify suitable values at mount. GID 9997 equals group `everybody`, this makes it usable with all apps.

#### EXT4
Ext4 requires similar values, but this time it can not be specified as mount option, instead it must be set on the mount point and sub directories:
```sh
mount /dev/mapper/luks $MOUNT

chcon -R u:object_r:sdcardfs:s0 $MOUNT
chgrp -R everybody $MOUNT
chmod -R 771 $MOUNT
```
Now you should be able to create files and folders from a file manager and other apps inside the mountpoint. As already mentioned, these will be app specific (in this case for appID 256):
```sh
ls -laZ /sdcard/luks
total 26
drwxrwx--x  4 root    everybody u:object_r:sdcardfs:s0                    1024 2020-04-04 21:28 .
drwxrwx--x 26 root    sdcard_rw u:object_r:sdcardfs:s0                    4096 2020-04-04 21:05 ..
-rw-------  1 u0_a256 u0_a256   u:object_r:sdcardfs:s0:c0,c257,c512,c768     0 2020-04-04 21:28 file
drwx------  2 u0_a256 u0_a256   u:object_r:sdcardfs:s0:c0,c257,c512,c768  1024 2020-04-04 21:26 gg
drwx------  2 root    everybody u:object_r:sdcardfs:s0                   12288 2020-04-04 21:15 lost+found
```
To make them "public" to other apps run the `chgrp`/`chmod` commands from above on the whole mountpoint again or on a specific subdirectory.


#### Bind default folders
Some apps don't allow custom data locations, for example many camera apps always write into `DCIM`. A solution is to bind mount these folder to some folders inside the encrypted mount:
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
The complete two parts of the script can be downloaded here: 
[luks.sh](/assets/android-luks/luks.sh) +
[mounts.sh](/assets/android-luks/mounts.sh)

Place them in the same directory on the phone, for example with `adb push *.sh /sdcard/`.

## Sources
Android namespaces: <https://android.stackexchange.com/questions/194651/why-bind-mounts-in-storage-emulated-0-are-not-visible-in-apps>

Storage views: <https://source.android.com/devices/storage/#runtime_permissions>

Mount tutorial: <https://android.stackexchange.com/questions/217741/how-to-bind-mount-a-folder-inside-sdcard-with-correct-permissions/217936#217936>

Android Security Internals:
<https://books.google.de/books?id=y11NBQAAQBAJ&pg=PA108&lpg=PA108&dq=zygote+namespace&source=bl&ots=nV_zzQvX3z&sig=ACfU3U0rBLpGYslPzvwECRr1rPu4nOgVzw&hl=en&sa=X&ved=2ahUKEwjZ8sPKm5joAhXYRBUIHRWuD1QQ6AEwBXoECAoQAQ#v=onepage&q=namespace&f=false>

Adoptable storage: <https://nelenkov.blogspot.com/2015/06/decrypting-android-m-adopted-storage.html>

## Further reading
Mount namespaces and shared subtrees:
<https://lwn.net/Articles/689856/>

Mount namespaces, mount propagation, and unbindable mounts:
<https://lwn.net/Articles/690679/>