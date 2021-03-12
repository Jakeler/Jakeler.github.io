---
layout: post
title: "UT61E Toolkit: Update 1.4 for Temperature Measurement"
categories: ut61e android
tags: software android multimeter bluetooth data release
---

## Sensor Types
![App temperature sensor settings](/assets/ut61e-android/1_4/thermo-settings.png)
![App temperature reference source](/assets/ut61e-android/1_4/thermo-ref-source.png)
### Thermocouple
![App thermocouple measurement](/assets/ut61e-android/1_4/thermocouple.png)
```
0.039 mV/K in 220 mV range with 0.01 mV resolution = 1/4 = 0.25
no other ranges: 220 mV / 0.039 = +- 5600 K
```
### Thermistor
![App thermistor measurement](/assets/ut61e-android/1_4/thermistor.png)
```
dR @ 8°C: 10 kΩ/K in 220 kΩ range with 10 Ω resolution = 1/1000 = 0.001

dR @ 125°C: 0.09 kΩ/K in 22 kΩ range with 1 Ω resolution = 1/80 = 0.0125
```
![UT61E thermistor ranges and resolution](/assets/ut61e-android/1_4/thermistor-ranges.svg)

https://reprap.org/wiki/Thermistor

https://github.com/reprap/firmware/blob/master/createTemperatureLookup.py

### Resistance Temperature Detector (RTD)
![App RTD measurement](/assets/ut61e-android/1_4/rtd.png)
```
0.003850 * 100 Ω = 0.385 Ω/K in 220 Ω range with 0.01 resolution = 1/38 = 0.026
0.003850 * 1000 Ω = 3.85 Ω/K in 2.2 kΩ range with 0.1 resolution = 1/38 = 0.026
no other ranges: 120 Ω / 0.385 = +312 °C
```

## Sensor Selection

| Type | Sensor | Max. T | Resolution | Accuracy | Cost incl. wire |
| ---- | ------ | ---------------- | ---------- | -------- | ------------ |
| Thermocouple | Type K | 1200 °C | 0.25 K         | 2 K (0.75%) | ~ 1 $ |
| Thermistor   | NTC 100k | 300 °C | 0.001-0.002 K | 3-15 K (5%) | ~ 0.5 $ |
| RTD          | PT1000   | 600 °C | 0.026 K         | < 0.5 K | ~ 3 $ |