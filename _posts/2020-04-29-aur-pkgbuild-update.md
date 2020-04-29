---
title: "Scripts for efficient AUR PKGBUILD updating"
layout: post
tags: linux scripting software
---
The most frequent task for maintaining packages in the Arch User Repository (AUR) is updating. Often this is a simple version bump, which can be a quite repetitive process, so i made some simple scripts to optimize it.

The following is organized in fish functions, but the bare commands and idea should also work if you use any other shell.


## Cloning
First to obtain the git repo with the packaging files, create `~/.config/fish/functions/clone-aur.fish`:
```sh
function clone-aur --description 'Clone aur repo by name'
	set repo $argv[1];
	
	git clone "ssh://aur@aur.archlinux.org/$repo.git"
	or git clone "https://aur.archlinux.org/$repo.git"

	cd $repo
end
```
This uses the first argument as package name and tries to clone the repo over SSH (with push capability), if this fails (because it is a foreign package) the `or` connection falls back to HTTPS (pull only).

To make the input of the package name more convenient i added tab completions with `~/.config/fish/completions/clone-aur.fish`:
```sh
# Completions for custom AUR clone function 
complete -c clone-aur -xa "(yay -Pc)"
```
The AUR helper `yay` is used to get a list of all (available + installed) packages here. 

For just the installed `pacman -Q | string replace ' ' \t` could be used instead.

### Example
```
$ clone-aur blackbox-explorer
blackbox  (community)  blackbox-cvs       (AUR)  blackbox-explorer-bin  (AUR)  blackbox-tools-git  (AUR)
blackboxwm      (AUR)  blackbox-explorer  (AUR)  blackbox-git           (AUR)  blackbox-vcs        (AUR)

```

## Update and Commit
The main job to update the PKGBUILD + SRCINFO in one command with `~/.config/fish/functions/upd-aur.fish`:
```sh
function upd-aur --description 'Update pkgbuild to new version'
	set new_ver $argv[1];
	sed -E "s#(pkgver=).*#\1$new_ver#" -i PKGBUILD
	
	updpkgsums
	makepkg --printsrcinfo > .SRCINFO
	
	git commit -v -a -m "Update to $new_ver"
end
```
It uses again the first argument and expects the target version string. Then it replaces the pkgver with sed/regex. Option `-E` to enable extended syntax and `-i` to edit inplace. The first part matches the line with `pkgver=` (brackets to create a capture group) and everything after that with `.*`. The replacement part inserts the first capturing group (containing pkgver=) with `\1` and appends the new version.
Based on that the new sources are downloaded and checksums generated with `updpkgsums` as usual. After the SRCINFO is also updated it automatically creates a commit with the standard message.

### Example
```
$ upd-aur 3.5.0
==> Retrieving sources...
  -> Downloading 3.5.0.tar.gz...
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 14.2M    0 14.2M    0     0  4374k      0 --:--:--  0:00:03 --:--:-- 4622k
  -> Found blackbox-explorer.sh
  -> Found blackbox-explorer.desktop
==> Generating checksums for source files...
[master 406fc20] Update to 3.5.0
 2 files changed, 5 insertions(+), 5 deletions(-)

```

## Check
Of course the package should then be built with `makepkg` or `makechrootpkg` and tested. Possible fixes can be amended to the update or addressed in additional commits. When it is all okay just `git push` and done!