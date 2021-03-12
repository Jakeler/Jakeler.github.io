---
layout: post
title: "UT61E Toolkit: Update 1.3"
categories: ut61e android
tags: software android multimeter bluetooth data release
---
After almost 2 years I began working on my app for the UT61E (and others from the UT61 series) again.
This release includes only small visible changes, a lot of work went into updating the Android API, especially the new security features required changes.

## UI Improvements
First let's look at the user interface changes. I have adjusted the background and colors for the categories, this should make it easier to read (better contrast):

![App start new colors](/assets/ut61e-android/1_3/start-colors.png)
![App scan RSSI bar](/assets/ut61e-android/1_3/scan-rssi.png)

Also I noticed that the scan results include a RSSI (Received Signal Strength Indication) value, this now gets showed as bar in list as well. It helps to find the correct device if there are many detected, the nearest device/multimeter should show the highest RSSI. 
## Bugfixes
There was a bug with other bluetooth modules. It was [reported on GitHub](https://github.com/Jakeler/UT61E-Toolkit/issues/10) from someone who used JDY-10 module, which worked with other apps, but here it did not return any data. 
The module needs a explicit write into a configuration register to enable notifications. This fix is included in 1.3 as well.
## SDK Platform
As already mentioned I haven't touched the codebase for a while, it still targeted SDK 27 (Android 8.1), so I had to jump 3 levels to SDK 30 (Android 11).

In previous versions there was a setting called "Log folder" in the app. You could put in a string with a name or path, then the app would internally create this folder and put all CSV logs into it. Now this is not possible anymore in the normal internal storage. Android 10 introduced [scoped storage](https://developer.android.com/training/data-storage#scoped-storage) and Android 11 enforces it. Apps only get access to their app-specific directory.

Otherwise the user can select a folder or file with the system file browser and grant permission.
This is implemented now, instead of a string input the app show the file explorer. It think this is nicer anyway to select it like this, instead of error prone manually typing the path. After it got scoped access to a directory the actual log files can still be created automatically.