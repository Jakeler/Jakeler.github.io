---
title: "Mount encrypted LUKS2 Container on Android"
layout: post
tags: android linux software encryption
---
```sh
pkg install root-repo
pkg install cryptsetup
```

```sh
truncate --size 5G test.img
cryptsetup luksFormat --type luks2 test.img
```


```sh
[ $(readlink /proc/1/ns/mnt) = $(readlink /proc/self/ns/mnt) ] || nsenter -t 1 -m /system/bin/sh
mount /dev/mapper/luks /mnt/runtime/write/emulated/0/luks/
mount -t exfat -o context=u:object_r:sdcardfs:s0,uid=0,gid=9997,fmask=0117,dmask=0006 /dev/mapper/luks $MOUNT

MOUNT=/storage/emulated/0/luks/
chcon -R u:object_r:sdcardfs:s0 $MOUNT
# chgrp -R sdcard_rw $MOUNT
chgrp -R everybody $MOUNT
chmod -R 771 $MOUNT


```
https://android.stackexchange.com/questions/194651/why-bind-mounts-in-storage-emulated-0-are-not-visible-in-apps
https://source.android.com/devices/storage/#runtime_permissions

https://android.stackexchange.com/questions/217741/how-to-bind-mount-a-folder-inside-sdcard-with-correct-permissions/217936#217936

Android Security Internals:
https://books.google.de/books?id=y11NBQAAQBAJ&pg=PA108&lpg=PA108&dq=zygote+namespace&source=bl&ots=nV_zzQvX3z&sig=ACfU3U0rBLpGYslPzvwECRr1rPu4nOgVzw&hl=en&sa=X&ved=2ahUKEwjZ8sPKm5joAhXYRBUIHRWuD1QQ6AEwBXoECAoQAQ#v=onepage&q=namespace&f=false

Mount namespaces and shared subtrees
https://lwn.net/Articles/689856/

Mount namespaces, mount propagation, and unbindable mounts
https://lwn.net/Articles/690679/