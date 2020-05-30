---
layout: post
title: "NAS with Autosuspend, WakeOnLAN and SSHFS Automount"
tags: linux storage nas software scripting
---
This post describes the setup of some convenient features that I deployed for the NAS, to automatically save power, make it wake up and mount it on the client only when needed.

### Autosuspend
Autosuspend is a nice tool to let a server suspend if it is idle (with configurable conditions).
For Fedora there is no official package available, so I installed it from source:
```sh
git clone https://github.com/languitar/autosuspend.git; cd autosuspend
python3 setup.py install --prefix=/usr
mv /usr/local/lib/python3.7/site-packages/autosuspend-3.0.0.dev0-py3.7.egg/etc/* /etc
mv /usr/local/lib/python3.7/site-packages/autosuspend-3.0.0.dev0-py3.7.egg/lib/systemd/system/* /usr/local/lib/systemd/system/
```
Starting with usual git clone and python module install, unfortunately the setup does not install the config and service files, so I had to move them manually afterwards.

Based on the default config this is resulting the `/etc/autosuspend.conf`:
```ini
[general]
interval = 30
idle_time = 900
suspend_cmd = /usr/bin/systemctl suspend
wakeup_cmd = sh -c 'echo 0 > /sys/class/rtc/rtc0/wakealarm && echo {timestamp:.0f} > /sys/class/rtc/rtc0/wakealarm'
woke_up_file = /var/run/autosuspend-just-woke-up
lock_file = /var/lock/autosuspend.lock
lock_timeout = 30

# This will use the Users check with the custom name RemoteUsers.
# Custom names are necessary in case a check class is used multiple times.
# Custom names can also be used for clarification.
[check.RemoteUsers]
class = Users
enabled = true
name = .*
terminal = .*
host = [0-9].*

# Custom
[check.SSH]
class = ActiveConnection
ports = 22
enabled = true

[check.NetworkBandwidth]
enabled = true
interfaces = eno1
threshold_send = 200
threshold_receive = 400
```
Three checks are enabled here, RemoteUser checks is someone is currently logged in over ssh, the ActiveConnection check on port 22 will reliably detect SSHFS connections. Also if there are other services causing some bandwidth usage it will detect it and not suspend with the last check. 

After starting/enabling with `systemctl enable --now autosuspend.service` it should look like this in `systemctl status autosuspend.service`:
```
● autosuspend.service - A daemon to suspend your server in case of inactivity
   Loaded: loaded (/etc/systemd/system/autosuspend.service; disabled; vendor preset: disabled)
   Active: active (running) since Fri 2020-05-15 12:23:19 CEST; 8h ago
     Docs: https://autosuspend.readthedocs.io/en/latest/systemd_integration.html
 Main PID: 1348 (autosuspend)
    Tasks: 1 (limit: 4536)
   Memory: 15.4M
   CGroup: /system.slice/autosuspend.service
           └─1348 /usr/bin/python3 /usr/bin/autosuspend -l /etc/autosuspend-logging.conf daemon

May 15 20:50:50 nas-server autosuspend[1348]: 2020-05-15 20:50:50,740 - autosuspend.Processor - INFO - Starting new check iteration
May 15 20:50:50 nas-server autosuspend[1348]: 2020-05-15 20:50:50,752 - autosuspend.Processor - INFO - Check SSH matched. Reason: Ports [22] are connected
May 15 20:50:50 nas-server autosuspend[1348]: 2020-05-15 20:50:50,753 - autosuspend.Processor - INFO - System is active. Resetting state
```
Here we see that it currently detects the SSH connection and does not suspend when I am logged in.

### Wake On LAN
First make sure WOL is set up on the server and works from the client with `wol xx:xx:xx:xx:xx:xx` using the MAC address of the server. This usually has to be enabled in the BIOS and might also need some software, read more [here](https://wiki.archlinux.org/index.php/Wake-on-LAN).

Now we want the client to wake up the server automatically. I searched for some guidance and found [this blog post](https://rolandtapken.de/blog/2017-02/how-wake-lan-remote-host-demand-using-systemds-sockets), he used a custom socket that triggers WOL on connection. It works, but I observed reduced performance with this approach: instead of >900 Mbit/s it delivered only about 300 Mbit/s, because all data must go through netcat and the local socket.

So I came up with a solution where the data does not get intercepted and therefore does not impact the performance. For that an extra systemd service is running to check if the server is already up and if not sends the WOL packet. 
For example on ArchLinux custom services should be placed into `/etc/systemd/system`, I created there a `nas-online.service`:
```ini
[Unit]
Description=Continuously check if the host is up, otherwise try WOL on start
After=network.target network-online.target
PartOf=mnt.mount

[Service]
Environment=HOST=nas-server
Environment=PORT=22
Environment=MAC=xx:xx:xx:xx:xx:xx

ExecStartPre=/bin/sh -c 'for n in `seq 1 6`; do nc -z ${HOST} ${PORT} && break || wol $MAC && sleep 10; done'
ExecStart=/bin/sh -c 'while :; do (nc -z -w 1s ${HOST} ${PORT} && echo "Host is up!" && sleep 30) || break; done'
```
In the [Unit] section it is defined as PartOf `mnt.mount` (which we will create in the next section), this makes systemd propagate  start/stop commands from the mount to this unit. The [Service] contains 2 small shell scripts. Pre start runs a maximum of 6 times a loop where it checks with `nc -z` (netcat zero IO) if the target is up, otherwise it sends the WOL packet and waits 10 secs. Then the main script just check every 30 secs if the target is still online and logs it. Per default this runs indefinitely, but as described above it does get stopped if `mnt.mount` gets inactive.

Test it with `systemctl start nas-online.service`, `systemctl stop nas-online.service` and `systemctl status nas-online.service`:
```
* nas-online.service - Continuously check if host is up, otherwise try WOL on start
     Loaded: loaded (/etc/systemd/system/nas-online.service; static; vendor preset: disabled)
     Active: inactive (dead) since Sat 2020-05-30 16:06:16 CEST; 4min 3s ago
    Process: 3589 ExecStartPre=/bin/sh -c for n in `seq 1 6`; do nc -z ${HOST} ${PORT} && break || wol $MAC && sleep 10; done (code=exited, status=0/SUCCESS)
    Process: 3768 ExecStart=/bin/sh -c while :; do (nc -z -w 1s ${HOST} ${PORT} && echo "Host is up!" && sleep 30) || break; done (code=killed, signal=TERM)
   Main PID: 3768 (code=killed, signal=TERM)

May 30 16:05:01 pc-arch systemd[1]: Starting Continuously check if host is up, otherwise try WOL on start...
May 30 16:05:04 pc-arch sh[3617]: Waking up xx:xx:xx:xx:xx:xx...
May 30 16:05:14 pc-arch systemd[1]: Started Continuously check if host is up, otherwise try WOL on start.
May 30 16:05:14 pc-arch sh[3774]: Host is up!
May 30 16:05:44 pc-arch sh[4140]: Host is up!
May 30 16:06:15 pc-arch sh[4198]: Host is up!
May 30 16:06:16 pc-arch systemd[1]: Stopping Continuously check if host is up, otherwise try WOL on start...
May 30 16:06:16 pc-arch systemd[1]: nas-online.service: Succeeded.
May 30 16:06:16 pc-arch systemd[1]: Stopped Continuously check if host is up, otherwise try WOL on start.
```

### Automount
The Systemd automount feature can automatically mount it when an access to the mountpoint is detected and unmount if it was idle for a specified time.

First it is important to login as root with SSH and accept the fingerprint for the server, otherwise it will not work because it is not in the known hosts list (like describe [here](https://wiki.archlinux.org/index.php/SSHFS)):
```sh
sudo -i
ssh -p 2222 jk@nas-server
```
Also it is of course not possible to enter a password, so make sure pubkey authentication is properly configured on the server.

Then an mount entry in `/etc/fstab` can be added:
```
jk@nas-server:/mnt   /mnt    fuse.sshfs  noauto,x-systemd.requires=nas-online.service,identityfile=/home/jk/.ssh/nas_ed25519,user,allow_other,default_permissions  0 0
```
Here we need a few options:
* _noauto:_ Disable direct mount on boot
* _x-systemd.requires=:_ Require online check/WOL to start
* _identityfile=:_ Specify the SSH keys, it will run as root and does not read the user ssh config
* _user:_ Allow user to mount/unmount
* _allow_other:_ Allow other users (than root) to access
* _default_permissions:_ Use permissions from the server

The `systemd-fstab-generator` will automatically produce an unit for the mountpoint, in this case `mnt.mount`. 


Now we need another unit: `mnt.automount` with the simple content:

```ini
[Automount]
Where=/mnt
TimeoutIdleSec=60
```
`Where` just specifies the mountpoint, also the filename must match the mount unit filename, which is based on the path. `TimeoutIdleSec` enables the automatic unmount, if it was idle for at least 60 secs in this case, you might want to set this higher.

Note: With the _x-systemd.automount_ fstab option the generator could also create the automount.service, but then the requires is applied to the automount and that would wake up the NAS always at the boot. We want to have it on the mount, because that wakes up the NAS only if it is actually mounted/used.

Finally start and enable it with `systemctl enable --now mnt.automount`. On any access to `/mnt` the automount will trigger the mount. 

You can see if it triggered with `systemctl status mnt.automount`:
```
● mnt.automount
     Loaded: loaded (/etc/fstab; generated)
     Active: active (running) since Fri 2020-05-15 19:49:22 CEST; 28min ago
   Triggers: ● mnt.mount
      Where: /mnt
       Docs: man:fstab(5)
             man:systemd-fstab-generator(8)

Mai 15 19:49:22 pc-arch systemd[1]: Set up automount mnt.automount.
Mai 15 19:49:27 pc-arch systemd[1]: mnt.automount: Got automount request for /mnt, triggered by 55768 (dolphin)
Mai 15 20:02:14 pc-arch systemd[1]: mnt.automount: Got automount request for /mnt, triggered by 59368 (nvim)
```
and `systemctl status mnt.mount`:
```
● mnt.mount - /mnt
     Loaded: loaded (/etc/fstab; generated)
     Active: active (mounted) since Fri 2020-05-15 20:30:41 CEST; 9min ago
TriggeredBy: ● mnt.automount
      Where: /mnt
       What: jk@localhost:/mnt
       Docs: man:fstab(5)
             man:systemd-fstab-generator(8)
      Tasks: 7 (limit: 19042)
     Memory: 2.3M
     CGroup: /system.slice/mnt.mount
             ├─61440 ssh -x -a -oClearAllForwardings=yes -oport=2222 -oidentityfile=/home/jk/.ssh/nas_ed25519 -2 jk@localhost -s sftp
             └─61448 /usr/bin/mount.fuse.sshfs jk@localhost:/mnt /mnt -o rw,noexec,nosuid,nodev,port=2222,identityfile=/home/jk/.ssh/nas_ed25519,allow_other,default_permissions,user

Mai 15 20:30:40 pc-arch systemd[1]: Mounting /mnt...
Mai 15 20:30:41 pc-arch systemd[1]: Mounted /mnt.
```

I hope it was helpful, let me know if it worked in the comments!