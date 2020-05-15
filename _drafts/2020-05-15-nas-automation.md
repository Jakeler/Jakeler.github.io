---
layout: post
title: "NAS with Autosuspend, WakeOnLAN and SSHFS Automount"
tags: linux storage nas
---

### Autosuspend
`/etc/autosuspend.conf`
```sh
git clone https://github.com/languitar/autosuspend.git; cd autosuspend
python3 setup.py install --prefix=/usr
mv /usr/local/lib/python3.7/site-packages/autosuspend-3.0.0.dev0-py3.7.egg/etc/* /etc
mv /usr/local/lib/python3.7/site-packages/autosuspend-3.0.0.dev0-py3.7.egg/lib/systemd/system/* /usr/local/lib/systemd/system/
```

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
After starting and enabling with `systemctl enable --now autosuspend.service` check the status, it should look like this:
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
Here we see that it correctly detects the SSH connection and does not suspend when I am logged in.

### Wake On LAN
First make sure WOL is set up on the server and works with `wol MAC`.
```ini
[Socket]
ListenStream=127.0.0.1:2222
Accept=true

[Install]
WantedBy=sockets.target
```

```ini
[Unit]
Description=Forwards request to another host. Sends WOL if not reachable.
Wants=network-online.target
After=network.target network-online.target

[Service]
# Replace with hostname or IP
Environment=HOST=nas-server
Environment=PORT=22
Environment=MAC=xx:xx:xx:xx:xx:xx

ExecStartPre=/bin/sh -c 'for n in `seq 1 6`; do nc -z ${HOST} ${PORT} && break || (wol $MAC >&2 && sleep 10); done'
ExecStart=/bin/nc -w 1s ${HOST} ${PORT}

StandardInput=socket
StandardOutput=socket
```
Enable...
```
● forward-ssh.socket
     Loaded: loaded (/etc/systemd/system/forward-ssh.socket; disabled; vendor preset: disabled)
     Active: active (listening) since Fri 2020-05-15 17:00:09 CEST; 3h 48min ago
   Triggers: ● forward-ssh@24-127.0.0.1:2222-127.0.0.1:38106.service
     Listen: 127.0.0.1:2222 (Stream)
   Accepted: 25; Connected: 1;
      Tasks: 0 (limit: 19042)
     Memory: 160.0K
     CGroup: /system.slice/forward-ssh.socket

Mai 15 17:00:09 pc-arch systemd[1]: Listening on forward-ssh.socket.
```
It shows that currently one connection is open. The "Triggers" line contains the full name of the started forwarding service, check the status there if you experience connection problems.


### Automount
Is is important to login as root with SSH now and accept the the fingerprint for localhost, otherwise it will not work because it is not in the known hosts list:
```sh
sudo -i
ssh -p 2222 jk@localhost
```
Also it is of course not possible to enter a password, so make sure pubkey authentication is properly configured.

Then an entry in `/etc/fstab` can be added:
```
jk@localhost:/mnt   /mnt    fuse.sshfs  noauto,x-systemd.automount,x-systemd.idle-timeout=60,port=2222,identityfile=/home/jk/.ssh/nas_ed25519,user,allow_other,default_permissions  0 0
```
Here we need a few options:
* _noauto:_ disable mount on boot
* _x-systemd.automount:_ let systemd mount if required 
* _x-systemd.idle-timeout=60:_ unmount after 60s of inactivity
* _port=2222:_ target port
* _identityfile=/home/jk/.ssh/nas_ed25519:_ specify the keys, ssh will run as root and does not read the user ssh config
* _user:_ allow user to mount/unmount
* _allow_other:_ allow other users (than root) to access
* _default_permissions:_ use permissions from the server


The `systemd-fstab-generator` will automatically produce two units from the mountpoint, in this case: `mnt.automount` and `mnt.mount`. On any access to `/mnt` the automount will trigger the mount. 

You can see if it triggered with `systemctl status`:
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

### Sources
<https://wiki.archlinux.org/index.php/SSHFS>

<https://rolandtapken.de/blog/2017-02/how-wake-lan-remote-host-demand-using-systemds-sockets>