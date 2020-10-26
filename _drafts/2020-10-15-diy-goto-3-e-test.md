---
layout: post
title: "DIY GoTo Telescope Mount [3] = Electronics for Testing"
tags: telescope astronomy hardware embedded software
---
In this post I describe how I set up a basic controller to test the mechanical setup.

![electronics setup overview](/assets/goto-telescope/e-test-setup.jpg)
# Electrical Prototype

| MS1 | MS2 | Microstepping |
| --- | --- | ------------ |
| V_IO | V_IO | 16 |
| GND | GND | 8 |
| GND | V_IO | 4 |
| V_IO | GND | 2 |

Where `V_IO` means pullup to the IO Voltage, +5V from USB in this case. `GND` is a pulldown as usual.

![RAMPS PCB with stepper drivers](/assets/goto-telescope/e-test-ramps.jpg)

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

https://www.reprap.org/wiki/RAMPS_1.4#Firmware_and_Pin_Assignments


http://www.airspayce.com/mikem/arduino/AccelStepper/
https://github.com/teemuatlut/TMCStepper/blob/master/examples/Simple/Simple.ino

```cpp
#include <Arduino.h>
#include <AccelStepper.h>
#include "pins.h"

byte directionPinAz = Y_DIR_PIN;
byte stepPinAz = Y_STEP_PIN;
byte enablePinAz = Y_ENABLE_PIN;

byte directionPinAlt = X_DIR_PIN;
byte stepPinAlt = X_STEP_PIN;
byte enablePinAlt = X_ENABLE_PIN;

byte ledPin = LED_PIN;

int microsteps = 8;
long steps_per_rev = microsteps*200;

int small_pulley_mm = 40;
int alt_rounds = 600/small_pulley_mm;
int az_rounds = 1200/small_pulley_mm;

// us timing
int pulse = 1;
int pause = 50;

AccelStepper stepperAz(1, stepPinAz, directionPinAz);
AccelStepper stepperAlt(1, stepPinAlt, directionPinAlt);


void rotate(bool clockwise) {
  digitalWrite(directionPinAz, clockwise? HIGH : LOW);
  
  for(int n = 0; n < steps_per_rev; n++) {
    digitalWrite(stepPinAz, HIGH);
    delayMicroseconds(pulse);
    digitalWrite(stepPinAz, LOW);
   
    delayMicroseconds(pause);
   
    digitalWrite(ledPin, !digitalRead(ledPin));
  }
}

void setup_stepper(AccelStepper *p_stepper, byte enablePin) {
  AccelStepper stepper = *p_stepper;
  stepper.setEnablePin(enablePin);
  stepper.setPinsInverted(false, false, true);
  stepper.enableOutputs();
}

void setup()
{

  Serial.begin(115200);
  Serial.println("Starting StepperTest");
  Serial.setTimeout(3000);

  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);

  setup_stepper(&stepperAz, enablePinAz);
  stepperAz.setAcceleration(steps_per_rev * 0.2); // RPS
  stepperAz.setMaxSpeed(steps_per_rev * 2.0);

  setup_stepper(&stepperAlt, enablePinAlt);
  stepperAlt.setAcceleration(steps_per_rev * 0.2); // RPS
  stepperAlt.setMaxSpeed(steps_per_rev * 1.0);
  
}

void printOutState(long prev, long pos) {
    if (pos == prev)
      return;

    long remains = pos % steps_per_rev;
    if (remains == 0) {
      Serial.print(pos/steps_per_rev);
    }
    else if (remains % (steps_per_rev/10) == 0) {
      Serial.print(".");
      digitalWrite(ledPin, !digitalRead(ledPin));
    }

}

void runWithOutput(AccelStepper &stepper, const char *name) {
    long prev = __LONG_MAX__;
    Serial.print(name);
    do {
      long pos = stepper.currentPosition();
      printOutState(prev, pos);
      prev = pos;
    } while (stepper.run());

    Serial.println(" DONE");
    digitalWrite(ledPin, LOW);

}

void loop() {
  Serial.println("Please send a number of revs");

  long n1 = Serial.parseInt();
  long n2 = Serial.parseInt();
  if (n1 != 0 || n2 != 0) {
    Serial.print("received one: ");
    Serial.println(n1);
    Serial.print("received two: ");
    Serial.println(n2);

    stepperAz.move(steps_per_rev*n1);
    runWithOutput(stepperAz, "AZ: ");
    stepperAlt.move(steps_per_rev*n2);
    runWithOutput(stepperAlt, "ALT: ");
    delay(1000);
  }
}
```

# Video
<iframe width="100%" height="500" src="https://www.youtube.com/embed/nFY8TDP12cU" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>