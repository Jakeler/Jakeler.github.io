---
layout: post
title: "Reading RD DPS power supply Modbus with Node-RED"
categories: modbus dps
tags: electronics protocol modbus psu nodejs
---
This post shows how Node-RED (a Node.js browser based interface to build data flows) can be used to read the current measurements from the DPS power supply series from RD over USB serial or Bluetooth. Then it can log the values as CSV and provide a web server, which makes it convenient for monitoring the output from remote locations. I used a DPS5005 communication version here, the same applies to the DPS5015, DPS5020, DPS8005 and DPH5005.

The manufacturer provides a really nice documentation of the used standard modbus protocol, which makes it easy to use it in other applications. Just download the zip with the official windows software, it includes the protocol documentation.

Then lets get started with creating the Node-RED flow. After the server was started with `npm start` the nodes can be added/connected on the web interface on the display server address.

First we need to communicate with the modbus serial port, there is a additional module available that does exactly this. It can be installed from Settings -> Palette -> Install -> Search `node-red-contrib-modbus`. For reading the data registers periodically the Modbus-Read node is suitable.

This is my final flow:
![node red flow screenshot](/assets/dps-modbus-nodered/read-flow.png)
You can also download it [here](/assets/dps-modbus-nodered/read.json) and import it directly onto your instance to play around.

The modbus node at the start reads the registers (function code 3) every 3 seconds. Address is the start and quantity is how many following get read. I choose 2 as start and 3 quantity, that corresponds to the voltage, current and power values (see the documentation mentioned above). The Server field must be set to the correct serial port, other defaults and 9600 baudrate is fine.

For binding a Bluetooth device as serial port on Linux `rfcomm` can be used, instructions are [here.](https://gist.github.com/0/c73e2557d875446b9603)

It outputs integer numbers, so it must be divided by these factors in a small javascript node:
```js
msg.payload[0] /= 100.0; //Voltage (V)
msg.payload[1] /= 1000.0; //Current (A)
msg.payload[2] /= 100.0; //Power (W)
msg.payload[3] = global.get("wh")+(msg.payload[2]/1200.0);
return msg;
```
The data is getting moved into a global variable a saved to disk in a csv file. In addition it calulates the accumulated Wh, which is interresting for battery charging. The capacity can be reset through triggering the `set wh to 0` node manually.

The webserver shows a simple HTML page with the data from the global vaiable, this is done in the build result node with some js again:
```js
values = global.get("values");
msg.payload = "<h3>DPS5005</h3>"
msg.payload += "Voltage: " + values[0] + " V<br>"
msg.payload += "Current: " + values[1] + " A<br>"
msg.payload += "Power: " + values[2] + " W<br>"
msg.payload += "Cap: " + global.get("wh") + " Wh"
return msg;
```
