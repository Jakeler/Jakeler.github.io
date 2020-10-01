---
layout: post
title: "DIY GoTo Telescope Mount [3] = Electronics for Testing"
tags: telescope astronomy plastics 3d-print hardware
---
In this post I describe how I set up a basic controller to test the mechanical setup.

# Electrical Prototype

| MS1 | MS2 | Microstepping |
| --- | --- | ------------ |
| V_IO | V_IO | 16 |
| GND | GND | 8 |
| GND | V_IO | 4 |
| V_IO | GND | 2 |

Where `V_IO` means pullup to the IO Voltage, +5V from USB in this case. `GND` is a pulldown as usual.

https://github.com/bigtreetech/BIGTREETECH-TMC2208-V3.0

```cpp
void rotate(bool clockwise) {
  digitalWrite(directionPin, clockwise? HIGH : LOW);
  
  for(int n = 0; n < steps_per_rev; n++) {
    digitalWrite(stepPin, HIGH);
    delayMicroseconds(pulse);
    digitalWrite(stepPin, LOW);
   
    delayMicroseconds(pause);
   
    digitalWrite(ledPin, !digitalRead(ledPin));
  }
}
```


http://www.airspayce.com/mikem/arduino/AccelStepper/
https://github.com/teemuatlut/TMCStepper/blob/master/examples/Simple/Simple.ino
