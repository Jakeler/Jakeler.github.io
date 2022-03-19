---
layout: post
title: "Custom Controller for Coolmoon RGB Fans"
tags: electronics led rgb mod
last_modified_at: 2022-03-19
---
Recently i bought some really cheap (about 7€ per piece!) RGB fans:
![fans running in the dark](/assets/coolmoon-rgb-controller/fans.jpg)
They look pretty nice and come with a controller/hub and wireless remote, but it has a few issues. It includes many animations, but selecting them with one button is cumbersome. Also they are all fairly fast and flashy, too distracting for my taste.
In addition the included controller can control the fan speed, but it makes a very annoying clicking noise, when a lower level is selected. I hooked up my oscilloscope and found that it does PWM with only 25 Hz (yes NOT kHz, just Hz). At full 12V they run with 1400 rpm, wich is too loud for case fans in my opinion.

### Reverse Engineering
So i opened the controller and looked at the PCB first:
![controller pcb front](/assets/coolmoon-rgb-controller/pcb-front.jpg)
Unfortunately the chips have no markings... the function is anyway quite obvious. The quartz with U1 does the RF part, U2 the LED control and U3 controls with the large FET above the speed control.

For the (assumed) FET i hooked a my transistor tester. This confirms that it is indeed a N-channel MOSFET.
![controller fan fet](/assets/coolmoon-rgb-controller/fet.jpg)
Looking closer i figured that it is probably a [HD30N03](https://datasheet.lcsc.com/szlcsc/HL-HD30N03_C216252.pdf). Driving it with high frequency did not work well though.

![controller pcb back](/assets/coolmoon-rgb-controller/pcb-back.jpg)
No parts on the back. The traces show that every fan is connected directly in parallel.<br>
The full pinout of the fan connector is here:
![fan connector pinout](/assets/coolmoon-rgb-controller/pinout.jpg)

Now probing with the logic analyzer at the LED data pins... 
![logic analyzer screenshot](/assets/coolmoon-rgb-controller/logic.png)
...reveals good news on the LED protocol, this is standard WS2812B stuff! The timing is a bit odd, but still in the extended spec.

### Building my own controller
So i decided to completely replace the controller with my version. To connect the fans i unsoldered five connectors from the original controller. Connected the power lines in parallel again, but chaining the LEDs with some diagonal silver wire, using the data out for the next data in:
![custom fan connector](/assets/coolmoon-rgb-controller/connector.jpg)
The serial led connection allows the control of every fan individually. For a simple connection i soldered a pin header on the LED input and a small JST for fan power. Furthermore a female header on the output, to also connect additional WS2812B LED strips.

To reduce the fan speed/noise i use a DC-DC converter set to 7V.

Each fan has 16 RGB LEDs, so for 5 fans that is already 80. In the PC sits a Arduino Pro Micro, the program is based on rawHID + FastLED and is therefore able to push a smooth 60Hz refresh rate. On the PC runs [hyperion.ng](https://github.com/hyperion-project/hyperion.ng), it provides a web interface to control the whole setup and Python scripts for effects.

Edit 2022: In the meantime I bought a new mainboard with suitable ARGB headers, so the Arduino is not needed anymore. Also I switched to the awesome OpenRGB software for control, read more in [this post]({% post_url 2022-03-19-openrgb-fans %}).
