---
layout: post
title: "UT61E Bluetooth: my Android App"
categories: ut61e android
---
In [this previous post]({% post_url 2018-03-09-UT61E-ble %}) i showed a hardware mod that adds Bluetooth low energy connectivity to the Uni-T UT61E multimeter. Then i wrote some python scripts to receive and decode the data on Linux, more on that [here]({% post_url 2018-03-11-linux-ble %}). 

Because a laptop or even desktop PC is not really convenient in the field, i have now developed an Android app to display, analyze and save the data! This post describes the features and how to use it.

![App start menu screenshot](/assets/ut61e-android/start-menu.png)

All source code is availible under the Apache 2 License on my [GitHub Repo](https://github.com/Jakeler/UT61E-Toolkit). If you looking just for the data decoding part to build an own app go to my [Java lib repo](https://github.com/Jakeler/ut61e_decoder). It compiles with Android Studio 3.1. Prebuild .apk's are coming soon, also to the Google Play Store! 
