---
layout: post
title: "Decoding the Smart BMS Protocol"
tags: software bms uart bluetooth battery protocol release
last_modified_at: 2022-03-19
---
Smart (meaning with UART / Bluetooth interface) battery management systems are widely available from china now. Almost all of them use a generic protocol for the communication. They also provide a (Windows) PC Software and Android App, which works fine, but I like to add more features and make it open source. So I wrote the protocol definition in [Kaitai Struct](https://kaitai.io/), a specific parsing language with YAML syntax, which can be compiled to parsers in many different languages like Java, C++, Python etc...

LTT Power manufactured the BMS I got and is nice enough to provide a spreadsheet with a rough description of the protocol on their [download page](https://www.lithiumbatterypcb.com/smart-bms-software-download/). Following is a introduction to the binary protocol, with graphs generated also from Kaitais Graphviz export.
In addition I made Sigrok protocol decoder, to make it visible with from a logic analyser capture. Everything is on GitHub in [this repo](https://github.com/Jakeler/bms-parser).

### Protocol Intro
In gerneral every packet has a start byte `DD` and end byte `77` (all in hex). After that comes a command code, there are a few special values: 165 = `A5` is a request to read and 90 = `5A` a write request. Then ID of the field/type and maybe some body data. Size numbers in the graphs are (unless otherwise specified) in byte.
![packet graph](/assets/bms-protocol-parser/packet.dot.svg)

For example to read the hardware info send: `DD A5 05 00 FF FB 77`, that is cmd ID `05` and always zero data length for read. Directly before the stop byte are 2 bytes checksum (how to calculate these later). <br>
The BMS responds with: `DD 05 00 11 53 50 31 35 53 30 30 31 2D 50 31 33 53 2D 33 30 41 FB FD 77`, again indicating that is cmd/type/field `05`, next one byte status (`00` is ok). A byte with data length and the data follows, in this type a 17 byte long (ascii) string.

Besides the simple hardware request are the IDs `04` for reading the individual cell voltages and `03` for various informations. Data in cell voltages contains just the numbers sequentially, 2 bytes per cell. For example `0E E6` = 3814 mV. Therefore a 13S pack gives 26 byte of data.
![cells graph](/assets/bms-protocol-parser/cell_voltages-hardware.dot.svg)

Probably the most import is `03` basic info. It contains the total pack voltages, actual current, remaining and typical capacity, this time in 10 mV/mA/mAh units, so multiply with 0.01 to get standard SI units. 4 byte are reserved for balancing flags, size 1b means one bit per cell. If the bit is set the cell is currently balancing. ProtList contains various error conditions where the protection kicked in, should usually be all zero. FetBits show if the charge and discharge FET is currently enabled. At the end a variable number of temperature sensors (NTCs), the raw value is here tenths of Kelvin.
![basic info graph](/assets/bms-protocol-parser/basic_info.dot.svg)

These were the standard IDs, but for configuration are many higher values included (read+write). They are not implemented is this parser, but I might add it in the future. In the Battery Monitor project (scripts to log BMS data on Linux) they started to [document them](https://github.com/simat/BatteryMonitor/blob/master/BMSdecoded.pdf).

#### Checksum calculation
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

### Sigrok Protocol Decoder
As announced in the beginning I made a sigrok BMS protocol decoder, which can be used in PulseView or DSView and a wide range of logic analyzer hardware. This is a Python module based of the compilation from my Kaitai Struct. It is in the [repo](https://github.com/Jakeler/bms-parser) under `decoder/bms/` to install it for a single user move it into `~/.local/share/libsigrokdecode/decoders` (or libsigrokdecode4DSL respectively).

Basic Info looks like this in DSView, showing the most important properties:
![basic info dsview screenshot](/assets/bms-protocol-parser/basic_dsview.png)

Or all the cell voltages:
![cell voltages dsview screenshot](/assets/bms-protocol-parser/cells_dsview.png)

Higher IDs (here `14`) will not be parsed further and the data block displayed just as hex bytes:
![settings bytes dsview screenshot](/assets/bms-protocol-parser/bytes_dsview.png)

### Reuse
If someone wants to make a own application with the parser you can compile it in any of the supported target languages from the Kaitai definition. `ksy` files are in the repo under `kaitai/`. I am planning to build a Android App to log the power usage and battery status, especially for electric vehicles.

#### Development 2022
Mainly I added an Python based CLI tool to read out basic info and cell voltages, it has also the option to log into an Mongo DB. To run it got to [\py](https://github.com/Jakeler/bms-parser/tree/master/py) and run `python main.py /dev/ttyXXX` (+ other parameters).

The best overview for live data provides the terminal UI:
![settings bytes dsview screenshot](/assets/bms-protocol-parser/tui.gif)
See the main repo [readme](https://github.com/Jakeler/bms-parser) for more details.