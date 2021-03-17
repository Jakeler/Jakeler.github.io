---
layout: post
title: "Battery Protection Chip of a Oneplus Smartphone Battery"
---

Searched for for "oneplus battery i2c site:forums.oneplus.com"
Found kernel log
```
[    4.792738] bq27541-battery 1-0055: DEVICE_TYPE is 0x541, FIRMWARE_VERSION is 0x200
[    4.792950] bq27541-battery 1-0055: Complete bq27541 configuration 0x601B
```
https://www.ti.com/lit/ds/symlink/bq27541.pdf
page 32:
- address 01010101 = 0x55
- normal read or inc read (multi byte)
- registers
    TEMP 0x06 / 0x07
    VOLT 0x08 / 0x09
    SOC 0x2c / 0x2d

![logic analyzer i2c voltage readout](/assets/i2c-phone-battery/dslogic-read-voltage1.png)
![logic analyzer i2c voltage readout](/assets/i2c-phone-battery/dslogic-read-voltage2.png)
`0x0e95 = 3733 mV`

![battery probe setup](/assets/i2c-phone-battery/TODO.jpg)

Discharge test
Charge test on DPS with curve
https://chromium.googlesource.com/chromiumos/platform/ec/+/master/driver/battery/bq27541.c

https://www.ti.com/tool/BQ27XXXSW-LINUX
https://elixir.bootlin.com/linux/v5.10.23/source/drivers/power/supply/bq27xxx_battery.c

https://cs.android.com/search?q=bq27541&sq=


# Orange Pi Setup
![Orange Pi PC2 pinout](/assets/i2c-phone-battery/opi-pinout-dark.jpg)
![Orange Pi I2C connection test with logic analyzer](/assets/i2c-phone-battery/connection-probe.jpg)


`overlays=i2c0`

```sh
orangepipc2:~:# i2cdetect -y 0
     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f
00:          -- -- -- -- -- -- -- -- -- -- -- -- -- 
10: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
20: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
30: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
40: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
50: -- -- -- -- -- 55 -- -- -- -- -- -- -- -- -- -- 
60: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
70: -- -- -- -- -- -- -- --                         
```

## Command Line Readout
```sh
orangepipc2:~:# i2cdump -y -r 0x02-0x2d 0 0x55 W
     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f    0123456789abcdef
00:       00 00 ff ff 71 0b 66 0f 80 01 13 06 27 09      ....q?f???????
10: 02 05 16 08 00 00 ff ff ff ff ff ff ff ff 8a f8    ????..........??
20: 28 00 46 12 00 00 ff ff 6f 0b c0 03 3e 00          (.F?....o???>.  

orangepipc2:~:# i2cget -y 0 0x55 0x08 w
0x0f66

orangepipc2:~:# i2cget -y 0 0x55 0x2c w
0x003e
```
`0x0f66 = 3942 mV`
`0x3e = 62 %` state of charge (soc)


## Python Readout
```
orangepipc2:~:# apt search smbus
...
python3-smbus/focal 4.1-2build2 arm64
  Python 3 bindings for Linux SMBus access through i2c-dev

orangepipc2:~:# apt install python3-smbus
...
```

```py
orangepipc2:~:# python3
Python 3.8.5 (default, Jan 27 2021, 15:41:15) 
[GCC 9.3.0] on linux
Type "help", "copyright", "credits" or "license" for more information.

>>> import smbus
>>> b = smbus.SMBus(0)
>>> b.read_word_data(0x55, 0x8)
3942
>>> b.read_word_data(0x55, 0x2c)
62
>>> x = b.read_word_data(0x55, 0x6) / 10 - 273.1
19.69999999999999
```
## Kernel Driver

### Device Tree Overlays
https://docs.armbian.com/User-Guide_Armbian_overlays/
https://github.com/armbian/sunxi-DT-overlays/tree/master/examples
https://elinux.org/Device_Tree_Reference

https://elixir.bootlin.com/linux/v5.10.23/source/Documentation/devicetree/overlay-notes.rst
https://elixir.bootlin.com/linux/v5.10.23/source/Documentation/devicetree/bindings/power/supply/battery.txt
https://elixir.bootlin.com/linux/v5.10.23/source/Documentation/devicetree/bindings/power/supply/bq27xxx.yaml

`i2c-bq27541.dts`

```conf
/dts-v1/;
/plugin/;

&i2c0 {
    #address-cells = <1>;
    #size-cells = <0>;
    bat: battery {
        compatible = "simple-battery";
        voltage-min-design-microvolt = <3200000>;
        energy-full-design-microwatt-hours = <11400000>;
        charge-full-design-microamp-hours = <3100000>;
    };

    bq27541: fuel-gauge@55 {
        compatible = "ti,bq27541";
        reg = <0x55>;
        monitored-battery = <&bat>;
    };
};
```

`armbian-add-overlay` is just a shell script. It calls `dtc`(Device Tree Compiler) then copies the result to `/boot/overlay-user/i2c-bq27541.dtbo` and enables it in `/boot/armbianEnv.txt`.
`user_overlays=i2c-bq27541`


### Readout
```sh
orangepipc2:jk:# cat /sys/class/power_supply/bq27541-0/uevent 
POWER_SUPPLY_NAME=bq27541-0
POWER_SUPPLY_TYPE=Battery
POWER_SUPPLY_STATUS=Charging
POWER_SUPPLY_PRESENT=1
POWER_SUPPLY_VOLTAGE_NOW=3942000
POWER_SUPPLY_CURRENT_NOW=0
POWER_SUPPLY_CAPACITY=63
POWER_SUPPLY_CAPACITY_LEVEL=Normal
POWER_SUPPLY_TEMP=188
POWER_SUPPLY_TECHNOLOGY=Li-ion
POWER_SUPPLY_CHARGE_FULL=2058000
POWER_SUPPLY_CHARGE_NOW=1553000
POWER_SUPPLY_CHARGE_FULL_DESIGN=3000000
POWER_SUPPLY_CYCLE_COUNT=960
POWER_SUPPLY_POWER_AVG=0
POWER_SUPPLY_HEALTH=Good
POWER_SUPPLY_MANUFACTURER=Texas Instruments
```

```sh
orangepipc2:jk:# cat /sys/class/power_supply/bq27541-0/voltage_now                 
3942000
```