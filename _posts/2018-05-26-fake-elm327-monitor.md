---
layout: post
title: "Beware of fake ELM327 without monitor mode!"
tags: automotive can protocol
---
Inspired by [this 34C3 talk](https://media.ccc.de/v/34c3-8758-how_to_drift_with_any_car) i wanted to analyze what is possible over the CAN bus on the OBD connector on my car.
Instead of the more expensive options, that allow proper sniffing with socketcan, i tried the cheapest solution: an "ELM327" bluetooth adapter from ebay and thought it would be enough to do a first check. Short answer: No, it's not.

Long answer: The ELM327 was originally developed and produced by Elm Electronics and got Firmware versions from 1.0 to 1.4b. These are pretty nice chips with various AT commands that allow for configuration of the adapters. The only real downside is the relatively low serial bandwidth and small buffer, which could cause dropped packets. Now just the IC cost about 20$ (depending on quantity) and therefore complete adapters already about 100$.
The device i bought costed only 7$ and cause i know these fakes exist, it was completely expected to receive a fake. There are relatively good fakes (noadays hard to find) that implement most of the commands and then the bad ones.

An convenient app to determine the features is the [ELM327 identifier](https://play.google.com/store/apps/details?id=com.applagapp.elm327identifier), it just tries the AT commands and displays if they got recognized. Turns out that mine was an especially bad one, only 23/103 checked commmands are functioning, even worse than on [this YT video](https://www.youtube.com/watch?v=b53mCtaJQ_o).

The app does not check all commands from the datasheet though (not even from firmware 1.0). For example to sniff/monitor all messages on the bus the receive filter must be disabled, like described [here](https://www.csmagics.com/single-post/2013/07/24/This-is-the-title-of-your-first-image-post). I won't go into details of the CAN protocol this time, just the general structure of a packet:

![can frame diagram](/assets/CAN_telegramm.svg)

One important fact, it starts always with the ID of the sender. In ODB-II there is a small range defined on which the ECUs can answer to the diagnostic requests, so the adapter chipset filters per default just these out. With the the command `AT MA` the original spec allows to monitor all without filter, but some fakes have this simply not implemented! So it is completely useless for reverse engineering.

Note that it works still fine for [standard OBD PIDs](https://en.wikipedia.org/wiki/OBD-II_PIDs), this does not use any AT commands, you can directly send the Mode and PID in `hex/ASCII` format, the chip automatically assembles a CAN packet with the default OBD ID, sends it to the car and you get the answer over serial (on Linux create with `rfcomm bind` a port), but i would not recommend them for anything a bit more advanced.

Next project will hopefully solve this with an MCP2515 connected over SPI to a small Linux controller (Raspberry or Orange Pi?).
