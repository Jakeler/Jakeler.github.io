---
layout: post
title: "Trying to Engrave PLA with a 3W Laser"
---
A few months ago i bought a diy laser cutter/engraver kit, including a 3W laser module, which works good for wood, foam, arcyl, etc... You might have already read my previous post about the software i use for it.
This post is about the idea to also engrave 3D printed PLA parts. In short: it doesn't work. Following my tests and the longer explanation.

I started slow with 500 mm/min and max. laser power and the laser cut right through the 1mm thick PLA test piece, this was surprising, because it does not even do that on thick cardboard with these parameters. 

So i increased the speed to 3000 mm/min (50 mm/s) an it just melted the surface. Further increased speed up to 6000 mm/min (100 mm/s) and/or reduced laser power produce just smaller disjointed melted spots and still no signs of darker surface like the other materials. 
The main problem lies in the low melting point of PLA, it gets already soft at 60°C. Before the material has a chance to burn or evaporate it melts and therfore spreads the energy over a larger area.

But it is possible to successfully do it of course, shown for example in this video:
<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/CcFxMpR1gF4" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>

The difference is that he uses a much more powerful laser, i guess at least 50W. Combined with high speeds (500 mm/s according to the description!) the PLA evaporates immediately, instead of melting.
