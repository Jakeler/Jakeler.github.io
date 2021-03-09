---
layout: post
title: "UT61E Toolkit: Update 1.2"
categories: ut61e android
tags: software android multimeter bluetooth release
--- 
Now quickly follows the [1.2 release](https://github.com/Jakeler/UT61E-Toolkit/releases/tag/v1.2) of my Android app for multimeter logging over bluetooth.
It includes a few optional features, that can be enabled in the settings. 

First the new data processing category.
It is now possible to ignore the value if the range is overloaded (instead of showing 225.8000), this is especially useful in modes where the meter regularly goes int OL, like resistance measurment.

![App start menu screenshot](/assets/ut61e-android/1_2/ignore_ol_shunt.png)


With enabled shunt mode the current through any shunt resistor gets automatically calculated from the measured voltage drop. (This was an idea from an user. Thanks again, Leon!)

![App start menu screenshot](/assets/ut61e-android/1_2/shunt_resistance.png)
![App start menu screenshot](/assets/ut61e-android/1_2/shunt_mode.png)

The directory where the CSV log files get saved/read is no longer hardcoded, it can be changed with this new setting: 

![App start menu screenshot](/assets/ut61e-android/1_2/logfolder_setting.png)
