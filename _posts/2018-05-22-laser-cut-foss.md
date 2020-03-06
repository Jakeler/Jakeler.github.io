---
layout: post
title: "Laser Cutting: Inkscape -> CNCjs -> GRBL"
tags: software oss laser
---
For DIY laser cutters exists good open source software, this posts shows my workflow from Inscape, to creating the GCODE and finally streaming it to the machine.

Inkscape is a vector graphics program, so it works normally with .svg, but it can also import various other formats like pdf or dxf. I use for gcode gerneration a small plugin (python script after all) from J Tech photonics, you can get the download and tutorial [here](https://jtechphotonics.com/?page_id=2012). It will output gcode that is compatible with GRBL.

When cutting out normal fonts some not connected parts fall out, which is normally not desired. I use a special Laser cutting font because of this, named [LaserCutRegular](https://www.ffonts.net/LaserCutRegular.font).

Now the only piece that's missing is software to stream the commands and allow control of the machine. For that i use [CNCjs](https://github.com/cncjs/cncjs), a node.js based web server that provides a useful interface in any web browser (except Internet Explorer ;). It includes a hardware accelerated visualization of the gcode and laser position and allows manual jogging. The interface is modular and everything can be moved or disabled if not needed. It is esspecially useful to watch the progress from other locations with access to the local network.

![CNCjs screenshot](/assets/laser/cncjs.png)

GRBL v1.1 has the new laser mode enabled. It runs perfectly fine on an Arduino based controller from a chinese DIY laser cutter kit.

### Results
This is the complete job from some quick tests.

Black paper with background light:
![laser cut paper glow](/assets/laser/Jake_glow.jpg)
Wood engraved:
![wood laser engraved](/assets/laser/wood_engrave.jpg)
