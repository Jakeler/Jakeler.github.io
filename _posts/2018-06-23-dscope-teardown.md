---
layout: post
title: "A look into the DScope USB oscilloscope"
tags: electronics oscilloscope teardown
--- 
The DScope from Dreamsourcelabs is a 2 channel oscilloscope with 50 MHz analag bandwidth and up to 200 MSPS (100 MSPS dual channel) for about 100$ now. The reason i bought it was that the DSView software is open source and runs on Linux (C++/QT5 based), unfortunately the development and the company seems pretty much dead now. It started with a kickstarter campain in 2013/2014 and the DSLogic 400 MHz Logic analyzer, this device is also based on that. Following a quick hardware overview.

![top view](/assets/dscope/front.jpg)

It uses the [CY7C68013A USB interface](http://www.cypress.com/file/138911/download) for communication with the PC. The processing does the [Spartan-6 XC6SLX9 FPGA](https://www.xilinx.com/support/documentation/data_sheets/ds160.pdf), which utilizes [MT48LC16M16A2 SDRAM](https://www.micron.com/~/media/Documents/Products/Data%20Sheet/DRAM/256Mb_sdr.pdf) as 256 Mb large sample memory.

![top view](/assets/dscope/half1.jpg)

The main [AD9288](http://www.analog.com/media/en/technical-documentation/data-sheets/AD9288.pdf) does dual channel analag to digital conversion with 100 MSPS. There is a [CPC1035N solid state relay](http://www.ixysic.com/home/pdfs.nsf/www/CPC1035N.pdf/$file/CPC1035N.pdf) and a [FTR-B3GA4.5Z relay](https://www.mouser.de/datasheet/2/164/Fujitsu_05192016_FTR-B3-1167187.pdf) per channel, these make the noticeable clicking noise when switching voltage ranges.
It also contains 2 potentiometers per channel, probably for calibaration purposes.

![top view](/assets/dscope/half2.jpg)

Not much on the bottom side, mostly SMD capacitors.

![top view](/assets/dscope/back.jpg)
