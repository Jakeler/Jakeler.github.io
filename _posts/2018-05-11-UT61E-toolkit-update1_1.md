---
layout: post
title: "UT61E Toolkit: Update 1.1"
categories: ut61e android
--- 
Today i have published the [1.1 release](https://github.com/Jakeler/UT61E-Toolkit/releases/tag/v1.1) of my Android app for multimeter logging over bluetooth. It finally includes the feature to view alredy recorded log CSV files directly.

After opening "VIEW RECORDED LOG" from the start menu, the file selector shows the files in the logfile directory:

![App start menu screenshot](/assets/ut61e-android/select-logfile.png)

The selected file gets parsed as CSV an the measurments displayed in a bargraph.

All lines starting with an `#` are interpreted as comment and mark the start/end of a series. They can then be chosen in the drop down menu a the top, only the selected series is shown in the graph. Normally this are the timestamps, when the log was started. It is also possible to manually add comments, to split the logs even more to show only a specific event.

Of course the same actions in the graph like pinch to zoom, selcting bar to show the value are supported. The line on the bottom shows some statistical information of the current graph viewport.

![App start menu screenshot](/assets/ut61e-android/view-time-select.png)
![App start menu screenshot](/assets/ut61e-android/view-log.png)
