---
layout: post
title: "Introducing BLE Serial: Binding Bluetooth 4.0 (low energy) modules to virtual serial ports"
---
[this list](https://gist.github.com/sam016/4abe921b5a9ee27f67b3686910293026#file-allgattcharacteristics-java-L57)
[battery monitor](https://github.com/simat/BatteryMonitor/blob/master/BMSdecoded.pdf)


`# ble-scan`
```
Discovered device: 20:91:48:4c:4c:54 -> UT61E -  JK
...
Found 2 devices!

Device 20:91:48:4c:4c:54 (public), RSSI=-58 dB
    01: Flags = 06
    ff: Manufacturer = 484d2091484c4c54
    16: 16b Service Data = 00b000000000
    02: Incomplete 16b Services = 0000ffe0-0000-1000-8000-00805f9b34fb
    09: Complete Local Name = UT61E -  JK
    0a: Tx Power = 00

...
```

```
optional arguments:
  -h, --help            show this help message and exit
  -t SEC, --scan-time SEC
                        Duration of the scan in seconds (default: 5.0)
  -d, --deep-scan       Try to connect to the devices and read out the service/characteristic UUIDs (default: False)
```

`# ble-scan -d`
```
  Service: 00001800-0000-1000-8000-00805f9b34fb
    Characteristic: 00002a00-0000-1000-8000-00805f9b34fb READ 
    Characteristic: 00002a01-0000-1000-8000-00805f9b34fb READ 
    Characteristic: 00002a02-0000-1000-8000-00805f9b34fb READ WRITE 
    Characteristic: 00002a03-0000-1000-8000-00805f9b34fb READ WRITE 
    Characteristic: 00002a04-0000-1000-8000-00805f9b34fb READ 
  Service: 00001801-0000-1000-8000-00805f9b34fb
    Characteristic: 00002a05-0000-1000-8000-00805f9b34fb INDICATE 
  Service: 0000ffe0-0000-1000-8000-00805f9b34fb
    Characteristic: 0000ffe1-0000-1000-8000-00805f9b34fb READ WRITE NO RESPONSE NOTIFY 
```

```
  -h, --help            show this help message and exit
  -v                    Increase verbosity (logs all data going through)
  -d DEVICE, --dev DEVICE
                        BLE device address to connect (hex format, can be seperated by colons)
  -w WRITE_UUID, --write-uuid WRITE_UUID
                        The GATT chracteristic to write the serial data, you might use "scan.py -d" to find it out
  -l FILENAME, --log FILENAME
                        Enable optional logging of all bluetooth traffic to file
```

`$ ble-serial -d 20:91:48:4c:4c:54`
```
21:02:55.823 | INFO | virtual_serial.py: Slave created on /dev/pts/3
21:02:56.410 | INFO | interface.py: Connected device 20:91:48:4c:4c:54
21:02:56.909 | INFO | interface.py: Receiver set up
21:02:56.909 | INFO | __main__.py: Running main loop!
```
`$ ble-serial -d 20:91:48:4c:4c:54 -w 0000ffe1-0000-1000-8000-00805f9b34fb`


`$ ble-serial -d 20:91:48:4c:4c:54 -l demo.txt`
`cat demo.txt`
```
2019-12-09 21:15:53.282805 <- BLE-OUT: 48 65 6c 6c 6f 20 77 6f 72 6c 64
2019-12-09 21:15:53.491681 -> BLE-IN: b0 b0 b0 b0 b0 b0 3b b0 b0 b0 ba b0 0d 8a
2019-12-09 21:15:53.999795 -> BLE-IN: b0 b0 b0 b0 b0 b0 3b b0 b0 b0 ba b0 0d 8a
```
