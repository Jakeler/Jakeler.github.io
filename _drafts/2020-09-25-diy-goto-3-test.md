---
layout: post
title: "DIY GoTo Telescope Mount [3] = Electronics for Testing"
tags: telescope astronomy plastics 3d-print hardware
---
In this post I describe how I set up a bisic controller

# Electrical Prototype
Table jumper, microstepping
https://github.com/bigtreetech/BIGTREETECH-TMC2208-V3.0

```c
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
