---
layout: post
title: "Setting RD DPS power supply with Node-RED Modbus"
categories: modbus dps
---
In [this post]({% post_url 2018-05-19-nodered-modbus-read-dps %}) i showed how how it is possible to read from the DPS power supplys with the Node-RED modbus module. Now also to setting/writing the parameters.

Function code 6 writes to a single registers 2 bytes, see my full flow:
![node red flow screenshot](/assets/dps-modbus-nodered-write-single.png)
You can also download it [here](/assets/dps-modbus-write.json) and import it directly onto your instance to play around.

For voltage or current the inject nodes output a floating point number, which then gets scaled and limted to the allowed integer range (`0-5000` on the DPS5005) before the modbus node sends it to the power supply.

For power switch and key lock just 0 or 1 gets send to disable or enable the setting.

It is also possible to write directly multiple registers with function code `16` (equals `0x10` in the documentation hex format), for example set quantity to 2 and inject a array json to set 10V and 0.5A:
![node red flow screenshot](/assets/dps-modbus-nodered-write-2.png)

Now Node-RED allows to extends this a lot of course, it could make it possible to set prameters over HTTP reqests, MQTT or automatically based on conditions to test other devices. For example it cycle through different voltages to check if the circuit performs as expected.
