---
layout: post
title: "Reading RD DPS power supply Modbus with Node-RED"
categories: modbus dps
---
This post shows how Node-RED (a Node.js browser based interface to build data flows) can be used to read the current measurments from the DPS power supply series from RD over USB serial or Bluetooth. Then it can log the values as CSV and provide a web server, which makes it convenient fot monitoring the output from remote locations. I used a DPS5005 communication version here, the same applies to the DPS5015, DPS5020, DPS8005 and DPH5005.

The manufactures provides a really nice documentation of the used standard modbus protocol, which makes it easy to used it in other application. Just download the zip with the official windows software, it includes the protocol documentation.
