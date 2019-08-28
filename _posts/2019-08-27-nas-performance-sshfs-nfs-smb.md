---
layout: post
title: "NAS Performance: NFS vs. SMB vs. SSHFS"
---
This is a performance comparison of the the three most useful protocols for networks file shares on Linux with the latest software. I have run sequential and random benchmarks and tests with rsync. The main reason for this post is that i could not find a proper test that includes SSHFS.

## NAS Setup
The hardware side of the server is based on an Dell mainboard wit a Intel i3-3220, so a fairly old 2 core / 4 threads CPU. It also does NOT support the AES-NI extensions (which would increase the AES performance [noticeably](https://turecki.net/content/getting-most-out-ssh-hardware-acceleration-tuning-aes-ni)) the encryption happens completely in software instead.

As storage two HDDs in BTRFS RAID1 were used, it does not make a difference though, because the tests are staged to hit almost always the cache on the server, so only the protocol performance counts.

Everything was tested over a local Gigabit Network.

I installed Fedora 30 Server on it and updated it to the latest software versions.

### SSHFS (also known as SFTP)
Relevant package/version: OpenSSH_8.0p1, OpenSSL 1.1.1c, sshfs 3.5.2

OpenSSH is probably running anyway on all servers, so this is by far the simplest setup: just install sshfs (fuse based) on the clients and mount it.
Also it is per default encrypted with ChaCha20-Poly1305. As second test i did choose AES128, because it is the most popular cipher, disabling encryption is not possible (without patching ssh). Then i added some mount options (suggested [here](https://ideatrash.net/2016/08/odds-and-ends-optimizing-sshfs-moving.html)) for convenience and ended with:

`sshfs -o Ciphers=aes128-ctr -o Compression=no -o ServerAliveCountMax=2 -o ServerAliveInterval=15 remoteuser@server:/mnt/share/ /media/mountpoint`

### NFSv4
Relevant package/version: Linux Kernel 5.2.8

The plaintext setup is also easy, specify the exports, start the server and open the ports. I used these options on the server: `(rw,async,all_squash,anonuid=1000,anongid=1000)`

And mounted with:
`mount.nfs4 -v nas-server:/mnt/share /media/mountpoint`

But getting encryption to work can be a nightmare, first setting up kerberos is more complicated than other solutions and then dealing with idmap on both server an client(s)...
After that you can choose from different levels, i set `sec=krb5p` to encrypt all traffic for this test (most secure, slowest).


### SMB3
Relevant package/version: Samba 4.10.6

The setups is mostly done with installing, creating the user DB, adding a share to `smb.conf` and starting the smb service. Encryption is disabled by default, for the encrypted test i set
`smb encrypt = required` on the server globally.
It uses AES128-CCM then (visible in `smbstatus`).

IDmapping on the client can be simply done as mount option, i used as complete mount command:

`mount -t cifs -o username=jk,password=xyz,uid=jk,gid=jk //nas-server/media /media/mountpoint`

## Test Methodology
The main test block was done with the flexible I/O tester (fio), written by Jens Axboe (current maintainer of the Linux block layer). It has many options, so i made a short script to run reproducible tests:
```sh
#!/bin/bash
OUT=$HOME/logs

fio --name=job-w --rw=write --size=2G --ioengine=libaio --iodepth=4 --bs=128k --direct=1 --filename=bench.file --output-format=normal,terse --output=$OUT/fio-write.log
sleep 5
fio --name=job-r --rw=read --size=2G --ioengine=libaio --iodepth=4 --bs=128K --direct=1 --filename=bench.file --output-format=normal,terse --output=$OUT/fio-read.log
sleep 5
fio --name=job-randw --rw=randwrite --size=2G --ioengine=libaio --iodepth=32 --bs=4k --direct=1 --filename=bench.file --output-format=normal,terse --output=$OUT/fio-randwrite.log
sleep 5
fio --name=job-randr --rw=randread --size=2G --ioengine=libaio --iodepth=32 --bs=4K --direct=1 --filename=bench.file --output-format=normal,terse --output=$OUT/fio-randread.log
```
First two are classic read/write sequential tests, with 128 KB block size an a queue depth of 4. The last are small 4 KB random read/writes, but with are 32 deep queue.
The direct flag means direct IO, to make sure that no caching happens on the client.

For the real world tests i used rsync in archive mode (`-rlptgoD`) and the included measurements:

`rsync --info=progress2 -a sshfs/TMU /tmp/TMU`

## Synthetic Performance
### Sequential
![sequential read diagram](/assets/nas-perf/SeqRead.svg)

Most are maxing out the network, the only one falling behind in the read test is SMB with encryption enabled, looking at the CPU utilization reveals that it uses only one core/thread, which causes a bottleneck here.

![sequential write diagram](/assets/nas-perf/SeqWrite.svg)

NFS handles the compute intensive encryption better with multiple threads, but using almost 200% CPU and getting a bit weaker on the write test.

SSHFS provides a surprisingly good performance with both encryption options, almost the same as NFS or SMB in plaintext! It seems lighter on the CPU, with up to 75% for the ssh process and 15% for sftp.

### Random
![4K random read diagram](/assets/nas-perf/4Kread.svg)

On small random accesses NFS is the clear winner, even with encryption enabled very good. SMB almost the same, but only without encryption. SSHFS quite a bit behind.

![4K random write diagram](/assets/nas-perf/4Kwrite.svg)

NFS still the fastest in plaintext, but has a problem again when combining writes with encryption. SSHFS is getting more competitive, even the fastest from the encrypted options, overall in the mid.

![random read latency diagram](/assets/nas-perf/ReadLatency.svg)
![random read latency diagram](/assets/nas-perf/WriteLatency.svg)

The latency mostly resembles the inverse IOPS/bandwith. Only notable point is the pretty good(low) write latency with encrypted NFS, getting most requests a bit faster done than SSHFS in this case.

## Real World Performance
This test consists of transfering a folder with rsync from/to the mounted share and a local tmpfs (RAM backed). It contains the installation of a game (Trackmania United Forever) and is about 1,7 GB in size with 2929 files total, so a average file size of 600 KB, but not evenly distributed.

![mixed read diagram](/assets/nas-perf/RsyncRead.svg)
![mixed write diagram](/assets/nas-perf/RsyncWrite.svg)

No big surprises here, NFS fastest in plaintext, SSHFS fastest in encryption. SMB always slightly behind NFS.

## Conclusion
In trusted home network NFS without encryption is the best choice on Linux. If you want encryption i would switch to SSHFS, it is a way simpler setup, more efficient and often not much slower than plaintext NFS. Samba/SMB is also not far behind, but only really makes sense in a mixed (Windows/Linux) environment.

Thanks for reading, i hope it was helpful.