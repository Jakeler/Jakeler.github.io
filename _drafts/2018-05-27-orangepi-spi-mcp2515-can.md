---
layout: post
title: "OrangePi + MCP2515 = 15$ CAN Sniffer (Linux SocketCAN)"
---

This post shows how to build a cheap CAN sniffer, that provides a standard Linux SocketCAN interface and is therefore compatible with all professional tools.

An OrangePi One was used in this tutuorial, it should also work with other OrangePi boards, especially the Allwinner based ones. [Armbian](https://www.armbian.com/) (a Debian/Ubuntu based distribution) provides the best support for these boards.

### Armbian

Armbians fairly recently introduced device tree overlay feature is used in the following chapter, so make sure you have a fresh installation of at least Armbian 5.30 with mainline kernel running. Simply go the [download page](https://www.armbian.com/download/) for your board and write the downloaded/uncompressed image with `dd`(Linux) or `Etcher`(Windows/Mac/Linux) to a SD card. After login over ssh, the custom overlay must be setup.

Full documentation of DT overlays is [here](https://docs.armbian.com/User-Guide_Allwinner_overlays/). In short: It describes the hardware config to the kernel in .dts files, that can individually be enabled. For the MCP2515 exists an example from the [Armbian github repo](https://github.com/armbian/sunxi-DT-overlays), so we simply use that.

Donwload it directly on the OPi:
```bash
wget https://raw.githubusercontent.com/armbian/sunxi-DT-overlays/master/examples/spi-mcp251x.dts
```
Install the kernel headers:
```sh
apt install linux-headers-next-sunxi
```
Then compile and install it:
```sh
armbian-add-overlay spi-mcp251x.dts
```
This will also automatically add the new module to `/boot/armbianEnv.txt` to activate it. 


### Hardware

The typical modules combine the MCP2515 with a TJA1050 transreceiver. To get high enough signal levels this chips requires 5V supply voltage, but we want to power the MCP2515 still with only 3.3V because the OrangePi GPIO is only 3.3V compatible, so cutting a power trace is necessary. The safest way is to do this on the backside of the PCB, where the one trace connects exactly this chip over 2 vias. I cut it in the middle and scraped of some of the coating to solder a thin cable onto it, the rest is the groundplane, i took also ground from there (not required, but can it make easier to connect):

![MCP2515 trace cut]()


The TJA1050 should then be powered from 5V over the custom connection and the rest over the standard VCC pin. The SPI pins go to the hardware SPI port on the OrangePi and the INT (interrupt) can be any free pin on the OPi (configured in the overlay), default is PA7:

![orange pi one pinout](/assets/orangepi/h3_pinout_mcp.png)

### Startup

Now reboot the OrangePi with the connected module. Check with `dmesg` for CAN and MCP251x messages, it should contain:
```
[   14.323650] mcp251x spi0.0 can0: MCP2515 successfully initialized.
```
Load the kernel modules:
```shell
modprobe can
modprobe can-dev
```
`dmesg` should show:
```
[   61.893616] can: controller area network core (rev 20170425 abi 9)
[   61.893724] NET: Registered protocol family 29
```
Setup the interface with for example 125 Kbit/s:
```bash
ip link set can0 type can bitrate 125000
```
Enable it:
```bash
ip link set can0 up
```

Install the `can-utils` package to get the standard tools like `cansend`, `cangen`, `candump`, `cansniffer`...
