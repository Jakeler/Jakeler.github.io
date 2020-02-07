---
layout: post
title: "Decoding the chinese smart BMS protocol"
---

### Basic protocol
![packet graph](/assets/bms-protocol-parser/packet.dot.svg)
![basic info graph](/assets/bms-protocol-parser/basic_info.dot.svg)
![cells graph](/assets/bms-protocol-parser/cell_voltages-hardware.dot.svg)


[battery monitor](https://github.com/simat/BatteryMonitor/blob/master/BMSdecoded.pdf)

### Checksum calculation
It is basically a sum over every relevant byte and then subtract that from 2^16 (65536), the result should match the checksum in the packet.
Now lets implement this in Python:
```py
def verify(packet):
    data = packet[2:-3]
    check = packet[-3:-1]
```
Here `data` contains all bytes that go into the checksum calculation. 
`check` is the 2 byte checksum of the current package, last bit is always the stop bit (0x77), so cut it off.
```py
    crc=0x10000
    for i in data:
        crc = crc-int(i)
    crc_b = crc.to_bytes(2, byteorder='big')
    return check == crc_b
```
It returns True if the checksums match and are therefore correct.
### Reading other parameters
### Writing parameters


### Sigrok Protocol Decoder
![basic info dsview screenshot](/assets/bms-protocol-parser/basic_dsview.png)

![cell voltages dsview screenshot](/assets/bms-protocol-parser/cells_dsview.png)

![settings bytes dsview screenshot](/assets/bms-protocol-parser/bytes_dsview.png)
