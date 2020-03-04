---
layout: post
title: "UT61E Bluetooth: my Android App"
categories: ut61e android
last_modified_at: 2018-05-12
---
In [this previous post]({% post_url 2018-03-09-UT61E-ble %}) i showed a hardware mod that adds Bluetooth low energy connectivity to the Uni-T UT61E multimeter. Then i wrote some python scripts to receive and decode the data on Linux, more on that [here]({% post_url 2018-03-11-linux-ble %}). 

Because a laptop or even desktop PC is not really convenient in the field, i have now developed an Android app to display, analyze and save the data! This post describes the features and how to use it.

![App start menu screenshot](/assets/ut61e-android/start-menu.png)
![App Bluetooth scan screenshot](/assets/ut61e-android/ble-scan.png)

After opening the app you can get new data from a multimeter, open a log file (this is currently not implemented) or change some settings. I choose to connect to the multimeter here. Note that the app asks for location permission on the first time, this is required in recent Android versions to scan for Bluetooth devices.

The Device scan shows all Bluetooth 4.0 devices, just select the multimeter.

![App Main screenshot](/assets/ut61e-android/main.png)
![App Logging screenshot](/assets/ut61e-android/main-logging.png)

Now the main screen opens. It shows the current state and measured value, also if the range is overloaded. The graph shows the history, you can drag back and forth to look at older/newer values. Pinch to zoom is also possible in both axis, the line above the graph with minimum/maximum/average/standard-deviation corresponds always only to the visible data, so it is pretty useful to quickly analyze it. A simple tap on a bar will show the exact value as popup.

With the `Log` switch on the bottom the logging can be enabled, it will save the values as .csv in the specified file under the `UT61E Logs/` folder on the flash storage.

![App Logging notification screenshot](/assets/ut61e-android/logging-notification.png)

The app will bring up this notification and update it everytime when new values got saved. The notification persists as long as the logging runs.

![App Settings screenshot](/assets/ut61e-android/settings.png)

The graph viewport size defines how many values the app holds in memory (how far the graph history goes back). Bluetooth UUID is preconfigured to the HM-11 module (must be changed if you use another Bluetooth module). 

Then there is the alarm feature, that let's the phone vibrate and/or ring if the measured value crosses over a specified limit. I recommend to set the multimeter to a fixed range and use a sample count setting higher than 1, because the UT61E has significant overshoot, which could trigger false alarms otherwise.

![App Alarm notification screenshot](/assets/ut61e-android/alarm-notification.png)

After a alarm was triggered you will see a notification like this. Note that the alarm feature works also with disabled screen, so you can save some battery.


All source code is available under the Apache 2 License on my [GitHub Repo](https://github.com/Jakeler/UT61E-Toolkit). If you looking just for the data decoding part to build an own app go to my [Java lib repo](https://github.com/Jakeler/ut61e_decoder). It compiles with Android Studio 3.1. Prebuilt .apk's are on the [releases tab](https://github.com/Jakeler/UT61E-Toolkit/releases), coming soon to the Google Play Store.

Update: It is on [Google Play](https://play.google.com/store/apps/details?id=jk.ut61eTool)!

New updates include more features like viewing logs in [update 1.1]({% post_url 2018-05-11-UT61E-toolkit-update1_1 %}) and external shunt current calculation in [update 1.2]({% post_url 2018-05-12-UT61E-toolkit-update1_2 %}).
