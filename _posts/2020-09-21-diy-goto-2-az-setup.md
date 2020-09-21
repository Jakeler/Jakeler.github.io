---
layout: post
title: "DIY GoTo Telescope Mount [2] = Azimuth Axis"
tags: telescope astronomy plastics 3d-print hardware
---
This post shows the build of the azimuth (horizontal) axis for my GOTO telescope mount.


## Large Pulley Profile
### CAD Design
First I tried to copy the tooth profile from the altitude axis pulley model [(previous post)]({% post_url 2020-08-02-diy-goto-1-alt-setup %}), but it did not work, because it is not strictly defined, so I made a new new drawing, based on the parameters:

![gt2 belt tooth profile](/assets/goto-telescope/gt2tooth.jpg)

Now fully constrained, with the exact measurements. Still with some tolerance for the 3D printing, implemented through a variable `#fine_tol` that intentionally makes the teeth a bit wider, here set to 0.05 mm.

![cad belt tooth drawing](/assets/goto-telescope/cad-az-cutout.png)

Similar to the previous approach the tooth gets repeated with a curve pattern and cut into the part. 
But now (as already noted in the "learnings" section) I put a valley on the edge, this gives it a less sharp edge and is therefore easier to print.

![cad pulley teeth profile](/assets/goto-telescope/cad-az-teeth.png)
Important is to add one to the teeth count calculation, because half of the tooth is protruding on each end, so effectively one full tooth is lost.

To make it fit on my printer build area I had to cut it again in segments. It is about 400 mm diameter = 1200 mm circumference. Making 7 parts would have worked, but I decided on 8 because it results in round numbers. So each part covers 45 degrees and is about 150 mm wide:
![cad azimuth pulley segment](/assets/goto-telescope/cad-az-pulley-45deg.png)

It fits in a circle as virtual assembly from all 8 segments:
![cad all segments circle](/assets/goto-telescope/cad-az-ass.png)
Imagine this ring around the static base plate of my existing telescope mount.

### Print
All segments were printed with PLA and 0.3 mm layer height 
(two different color because of what I had left). 
![azimuth pulley profile 8 segments](/assets/goto-telescope/az-profile-x8.jpg)
The edges came out much better this time, did not require any postprocessing:
![azimuth pulley profile print edge](/assets/goto-telescope/az-profile-edge.jpg)

## Motor Mount
The motor should be connected to top plate of the base. So the shaft points downwards to sit at the same height as the belt, which goes around the bottom base plate.

### CAD design
The design is not too complicated, I added again some space to slide the motor, which allows adjustment of the belt tension.
It has a slightly curved wall, where it touches the round base plate.
![cad motor mount bottom](/assets/goto-telescope/cad-az-mount-bottom.png)
![cad motor mount top](/assets/goto-telescope/cad-az-mount.png)

### Print and Assembly
I drilled again four 2 mm holes and screwed it onto the plate.
![az axis drive assembly](/assets/goto-telescope/az-motor-build.jpg)
The printed profile is currently only attached by some double side tape. This is enough, because the belt clamps it as well, but I will nevertheless replace it with a more solid glue soon.
![az axis drive assembly side](/assets/goto-telescope/az-motor-ass.jpg)

## Outlook
In the next post I will finally show it in action! With the basic electronics and controller code that I have so far, to test the mechanical setup.