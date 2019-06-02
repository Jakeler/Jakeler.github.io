---
layout: post
title: "FastLED vs NeoPixelBus vs NeoPixel: ESP32 Performance"
--- 

## Tests

### Signal Timing
Inconsistency: Highest - Lowest
Deviation from 800kHz

### Code Size
Diagram?
```
Base Sketch  PROGRAM: [==        ]  15.6% (used 204684 bytes from 1310720 bytes)
FastLED      PROGRAM: [==        ]  16.7% (used 218976 bytes from 1310720 bytes)
NeoPixelBus  PROGRAM: [==        ]  16.4% (used 214652 bytes from 1310720 bytes)
NeoPixel     PROGRAM: [==        ]  16.1% (used 211144 bytes from 1310720 bytes)
```

### RAM Usage
```
Base: 376420
FastLED: 375052 - 369648
NeoPixelBus: 374100 - 360600
NeoPixel: 376064 - 373364
```
