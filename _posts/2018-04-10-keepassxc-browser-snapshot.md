---
layout: post
title: "KeePassXC-Browser with beta/snapshot browser versions"
categories: kepassxc browser
---
This is just just a quick tipp about the relatively new KeePassXC-Browser extension that (as the name implies) allows to connect to the KeePassXC programm from various browsers.

Normally a browser can be enabled from the KeePassXC settings checkboxes, but this does not work with non standard browser config paths from "unstable" editions or even other chromium engine based browsers (that also support the extension). There are just these 4 paths hardcoded (on linux for example):
```c++
    const QString HostInstaller::TARGET_DIR_CHROME = "/.config/google-chrome/NativeMessagingHosts";
    const QString HostInstaller::TARGET_DIR_CHROMIUM = "/.config/chromium/NativeMessagingHosts";
    const QString HostInstaller::TARGET_DIR_FIREFOX = "/.mozilla/native-messaging-hosts";
    const QString HostInstaller::TARGET_DIR_VIVALDI = "/.config/vivaldi/NativeMessagingHosts";
```
[KeePassXC Source on GitHub](https://github.com/keepassxreboot/keepassxc/blob/release/2.3.2/src/browser/HostInstaller.cpp#L38)

Now for example vivaldi snapshot has instead `~/.config/vivaldi-snapshot/` as standard. For Google Chrome Beta it is `~/.config/google-chrome-beta`, there is also a comprehensive doc about the [User Data Directory here](https://chromium.googlesource.com/chromium/src/+/master/docs/user_data_dir.md). 

So the extension will not find the `NativeMessagingHosts` folder and therefore never connect.

The simplest way to solve this is to just add a symlink, so for vivaldi snapshot:
```bash
cd ~/.config/
ln -s vivaldi-snapshot/ vivaldi/
```
Then it just works with the enabled Vivaldi option. It is of course also possible to symlink to a other unused browser config path and enable that.

Another way would be to really move the User Data Directory with the `--user-data-dir` command-line flag or obviously change the paths/options in the KeePassXC source and recompile the whole thing.
