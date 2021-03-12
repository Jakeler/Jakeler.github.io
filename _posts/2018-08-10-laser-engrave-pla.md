---
layout: post
title: "Trying to Engrave PLA with a 3W Laser"
tags: experiment laser plastic engrave
---
A few months ago i bought a diy laser cutter/engraver kit, including a 3W laser module, which works good for wood, foam, arcyl, etc... You might have already read my previous post about the software i use for it.
This post is about the idea to also engrave 3D printed PLA parts. In short: it doesn't work properly. Following my tests and the longer explanation.

![500 mm/min speed](/assets/laser-pla/500.jpg){:height="50%" width="50%"}

I started slow with 500 mm/min and max. laser power and the laser cut right through the 1mm thick PLA test piece, this was surprising, because it does not even do that on thick cardboard with these parameters.

![2000 mm/min speed](/assets/laser-pla/2000.jpg){:height="49%" width="49%"}
![6000 mm/min speed](/assets/laser-pla/6000.jpg){:height="49%" width="49%"}

So i increased the speed to 3000 mm/min (50 mm/s) an it just melted the surface. Further increased speed up to 6000 mm/min (100 mm/s) and/or reduced laser power produce just smaller disjointed melted spots and still no signs of darker surface like the other materials. 
The main problem lies in the low melting point of PLA, it gets already soft at 60°C. Before the material has a chance to burn or evaporate it melts and therfore spreads the energy over a larger area.

But it is possible to successfully do it of course, shown for example in this video:
{% include yt-video.html url='https://www.youtube-nocookie.com/embed/CcFxMpR1gF4' %}

The difference is that he uses a much more powerful laser, i guess at least 50W. Combined with high speeds (500 mm/s according to the description!) the PLA evaporates immediately, instead of melting.
