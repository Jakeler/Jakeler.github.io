---
layout: post
title: "FastLED vs. NeoPixelBus vs. NeoPixel: ESP32 Performance"
--- 
Following a comparison of the three most popular libraries for driving WS2812B addressable RGB LEDs. Everything was measured with a logic analyzer, to circumvent deviations in `millis()`, because some libraries disable interrupts.
## Introduction
### WS2812B Protocol
![protocol logic](/assets/neopixel-perf/protocol.png)
The logic 0/1 is represented by a specific pattern, 0 is a short high pulse and a long low, 1 is long high pulse and short low. The protocol is just a continuous stream of these bits. A normal RGB LED needs 24 bits, so the first chip in the chain will cut 24 off and passtrough the rest. At the end a longer period of low signals a reset:

![protocol logic](/assets/neopixel-perf/protocol2.png)

That also means that it must happen in one go, you can't stop after you started and resume later... which makes these quite tricky to drive.
800 kHz gives 1.25 μs per bit. -> 30 μs (0.03 ms) per RGB LED. So for example 3 ms for 100 LEDs.

### Driving Methods
Each of these three libraries uses a different method for generating the signal on the ESP32 platform. 
The Adafruit NeoPixel lib does it completely in software (classic bit banging). NeoPixelBus utilizes the I2C controller hardware to write the data out.
FastLED uses [RMT](https://docs.espressif.com/projects/esp-idf/en/latest/api-reference/peripherals/rmt.html), a ESP32 specific driver actually intended for infrared remote control signals, but flexible enough for many other applications.

**Important Note:** The classic NeoPixel library has a serious issue, bit banging does not work for more than 33 pixels on the ESP32, because the underlying FreeRTOS makes a tick (and possibly task switch) every millisecond, which causes data corruption:
![protocol logic](/assets/neopixel-perf/neopixel-bug.png)
(every pixel should be 0x001a00 here)

This also screws up the retransmisson for following chips, so they will usually all display wrong colors. I still included it in the tests, because i think the ressouce usage could be interesting for comparison and a hint for other platforms. 
[See the GitHub issue for details.](https://github.com/adafruit/Adafruit_NeoPixel/issues/139) They plan to fix this by utilizing RMT like in FastLED.


### Tests
The test has three parts: switching one led to green and black, filling the whole strip with a single color and switching it off (black), calculating a rainbow with a linear hue gradient and switching it off again. Every action is done a hundred times as fast as possible.
In addition the code writes a trigger pin for the logic analyzer and prints out the free heap (RAM) over serial, after every loop.

Latest software versions at testing time:

| Name | Version | Release date |
| -- | -- | -- |
| FastLED | 3.2.6 | 31.01.19 |
| Makuna NeoPixelBus| 2.4.4 | 01.04.19 |
| Adafruit NeoPixel | 1.2.3 | 17.05.19 |
| PlatformIO Espressif 32 | 1.8.0 | 19.04.19 |
| Arduino Core | 1.0.2 | 16.04.19 |
| ESP-IDF | 3.2 | 11.04.19 |

The source code was written to be readable, so no crazy optimizations and using the builtin library functions where possible. That means for the rainbow test the FastLED `fill_rainbow` function was used, the other libraries don't provide a suitable function, so it was done directly with a for loop.
Also the global brightness was reduced to 20% (51/255). FastLED and NeoPixel alway provide this functionality, for NeoPixelBus the NeoPixelBrightnessBus object was used.
The full source code is available [here](https://github.com/Jakeler/NeoPixel-Performance).

On the hardware side a DOIT ESP32 Devkit and DSLogic Plus @ 400 MHz was used to measure the performance.


## Results

### Flash Usage (binary size)
![code size bar graph](/assets/neopixel-perf/flash.svg)

Since FastLED has by far the most features and NeoPixel the least this result is no surprise. NeoPixelBus comes in between, adding compared to NeoPixel proper Color objects and animation tools.


### RAM Usage
![ram usage graph](/assets/neopixel-perf/ram.svg)

Interestingly FastLED is not too bad in the runtime RAM usage, but compared to Adafruits NeoPixel still a monster. The absolute minimum would be `100 px * 3 Byte(RGB) = 300 Byte` or 3000 Byte for the 1000 LED strip, so only 56 Byte overhead, independent of the length, is quite impressive!
NeoPixelBus with its I2C Method and brightness object is the clear loser here, especially on the long 1000 pixel strip, consuming more than 15 KB.


### Performance
The following numbers are unless otherwise noted excluding transmission time, because it is always the same at 800 kbit/s. 

*delay* (latency) is the time between calling `.show()` and the actual start of data transmission. 
The others are measured in the cycle between end of last transmission and start of next transmission, 50 μs is the minimum, required as reset signal.

#### 100 LEDs
![100 led performance graph](/assets/neopixel-perf/perf100.svg)

NeoPixelBus takes unexpected much time in every discipline here, but shows no difference on the more compute intensive actions, it almost looks like there is some 2ms clock that has to run down here. NeoPixel stands out with almost no latency (only 2 μs), which makes sense, there is pretty much no setup required for bit banging. They seem to set the reset duration to a unnecessary long 300 μs though, which gives FastLED a marginal lead overall.

#### 1000 LEDs
![1000 led performance graph](/assets/neopixel-perf/perf1000.svg)

The situation with NeoPixelBus completely changes on the long strip, it even reduced the prepare time and is quite competitive now, oddly still no speed difference between the actions. FastLED shows increased latency and prepare time, especially on the rainbow fill, where it is the slowest now. NeoPixel takes the clear overall lead, the effect of computation is now measurable on the rainbow action.

In the real world you probably won't notice a difference though. At 800 kbit/s the data transmission for 1000 LEDs with 24 Bit each takes anyway already 30 ms, so the prepare time of 0.5 ms or even 2.2 ms is not really significant:
![1000 led performance graph with full transmission](/assets/neopixel-perf/real-perf1000.svg)

All libraries are able to drive the 1000 LED strip with more than 30 Hz (below 33 ms) in the end. On less LEDs the difference is proportionally larger, but the question is if that is important when it already runs at 500 Hz...

### Signal Timing Stability
![timing graph](/assets/neopixel-perf/timing.svg)

FastLED with RMT is the obvious winner here, i could not measure deviations from 800 kHz, it is rock solid. 

Ignoring the 1ms issue on NeoPixel the timing is pretty stable, but the frequency overall a bit below the spec. 

NeoPixelBus hits the frequency on average, but is a bit unstable with +/- 30 kHz, this does not seem to make a difference in reality though, i did not notice any wrong colors on a real strip.

## Conclusion
It is a matter of taste. Adafruits NeoPixel would be the choice for simplicity and high speed with low resources, unfortunately it doesn't work anymore on the ESP32. 
NeoPixelBus has a similar API and structure, is not the fastest and quite RAM heavy, but good enough for most applications, especially on the ESP32 with relatively large memory.
FastLED provides IMHO after all the best package, very feature rich and still efficient. 

Thanks for reading, i hope it was helpful.
