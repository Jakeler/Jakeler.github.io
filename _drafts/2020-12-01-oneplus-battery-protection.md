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
    AI 0x14 / 0x15
    SOC 0x2c / 0x2d

Discharge test
Charge test on DPS with curve
https://chromium.googlesource.com/chromiumos/platform/ec/+/master/driver/battery/bq27541.c

https://www.ti.com/tool/BQ27XXXSW-LINUX
https://elixir.bootlin.com/linux/v5.10.23/source/drivers/power/supply/bq27xxx_battery.c

https://cs.android.com/search?q=bq27541&sq=


```sh
sudo i2cdetect -y 0
     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f
00:          -- -- -- -- -- -- -- -- -- -- -- -- -- 
10: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
20: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
30: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
40: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
50: -- -- -- -- -- 55 -- -- -- -- -- -- -- -- -- -- 
60: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- 
70: -- -- -- -- -- -- -- --                         
orangepipc2:~:% i2get
zsh: command not found: i2get
orangepipc2:~:% i2cdump -h
Error: Unsupported option "-h"!
Usage: i2cdump [-f] [-y] [-r first-last] [-a] I2CBUS ADDRESS [MODE [BANK [BANKREG]]]
  I2CBUS is an integer or an I2C bus name
  ADDRESS is an integer (0x03 - 0x77, or 0x00 - 0x7f if -a is given)
  MODE is one of:
    b (byte, default)
    w (word)
    W (word on even register addresses)
    s (SMBus block)
    i (I2C block)
    c (consecutive byte)
    Append p for SMBus PEC
orangepipc2:~:% man i2cdump
orangepipc2:~:% man i2cdump
orangepipc2:~:% i2cdump -r 0x01-0x2d 0 0x55 w
Error: Could not open file `/dev/i2c-0': Permission denied
Run as root?
orangepipc2:~:% sudo i2cdump -r 0x01-0x2d 0 0x55 w
WARNING! This program can confuse your I2C bus, cause data loss and worse!
I will probe file /dev/i2c-0, address 0x55, mode word
Probe range limited to 0x01-0x2d.
Continue? [Y/n] 
     0,8  1,9  2,a  3,b  4,c  5,d  6,e  7,f
00:      0002 0000 ff00 ffff 72ff 0b72 660b 
08: 0f66 800f 0180 1301 0613 2506 0925 0209 
10: 0502 1405 0814 0008 0000 ff00 ffff ffff 
18: ffff ffff ffff ffff ffff 8aff f88a 28f8 
20: 0028 4600 1246 0012 0000 ff00 ffff 70ff 
28: 0b70 c00b 03c0 3e03 003e 4f00           
orangepipc2:~:% man i2cdump                       
orangepipc2:~:% sudo i2cdump -r 0x01-0x2d 0 0x55 W
Error: Range parameter not compatible with selected mode!
orangepipc2:~:% sudo i2cdump -r 0x02-0x2d 0 0x55 W
WARNING! This program can confuse your I2C bus, cause data loss and worse!
I will probe file /dev/i2c-0, address 0x55, mode word
Only probing even register addresses.
Probe range limited to 0x02-0x2d.
Continue? [Y/n] 
     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f    0123456789abcdef
00:       00 00 ff ff 71 0b 66 0f 80 01 13 06 25 09      ....q?f?????%?
10: 02 05 14 08 00 00 ff ff ff ff ff ff ff ff 8a f8    ????..........??
20: 28 00 46 12 00 00 ff ff 6f 0b c0 03 3e 00          (.F?....o???>.  
orangepipc2:~:% sudo i2cdump -r 0x01-0x2d 0 0x55 W
Error: Range parameter not compatible with selected mode!
orangepipc2:~:% sudo i2cdump -r 0x01-0x2c 0 0x55 W
Error: Range parameter not compatible with selected mode!
orangepipc2:~:% sudo i2cdump -r 0x02-0x2d 0 0x55 W
WARNING! This program can confuse your I2C bus, cause data loss and worse!
I will probe file /dev/i2c-0, address 0x55, mode word
Only probing even register addresses.
Probe range limited to 0x02-0x2d.
Continue? [Y/n] 
     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f    0123456789abcdef
00:       00 00 ff ff 74 0b 66 0f 80 01 13 06 25 09      ....t?f?????%?
10: 02 05 14 08 00 00 ff ff ff ff ff ff ff ff 8a f8    ????..........??
20: 28 00 46 12 00 00 ff ff 71 0b c0 03 3e 00          (.F?....q???>.  
orangepipc2:~:% sudo i2cdump -r 0x02-0x2d 0 0x55 W
WARNING! This program can confuse your I2C bus, cause data loss and worse!
I will probe file /dev/i2c-0, address 0x55, mode word
Only probing even register addresses.
Probe range limited to 0x02-0x2d.
Continue? [Y/n] 
     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f    0123456789abcdef
00:       00 00 ff ff 73 0b 66 0f 80 01 13 06 25 09      ....s?f?????%?
10: 02 05 14 08 00 00 ff ff ff ff ff ff ff ff 8a f8    ????..........??
20: 28 00 46 12 00 00 ff ff 70 0b c0 03 3e 00          (.F?....p???>.  
orangepipc2:~:% sudo i2cdump -r 0x02-0x2d 0 0x55 W
WARNING! This program can confuse your I2C bus, cause data loss and worse!
I will probe file /dev/i2c-0, address 0x55, mode word
Only probing even register addresses.
Probe range limited to 0x02-0x2d.
Continue? [Y/n] 
     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f    0123456789abcdef
00:       00 00 ff ff 72 0b 66 0f 80 01 13 06 25 09      ....r?f?????%?
10: 02 05 14 08 00 00 ff ff ff ff ff ff ff ff 8a f8    ????..........??
20: 28 00 46 12 00 00 ff ff 6f 0b c0 03 3e 00          (.F?....o???>.  
orangepipc2:~:% sudo i2cdump -r 0x02-0x2d 0 0x55 W
WARNING! This program can confuse your I2C bus, cause data loss and worse!
I will probe file /dev/i2c-0, address 0x55, mode word
Only probing even register addresses.
Probe range limited to 0x02-0x2d.
Continue? [Y/n] 
     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f    0123456789abcdef
00:       00 00 ff ff 72 0b 66 0f 80 01 13 06 25 09      ....r?f?????%?
10: 02 05 14 08 00 00 ff ff ff ff ff ff ff ff 8a f8    ????..........??
20: 28 00 46 12 00 00 ff ff 6f 0b c0 03 3e 00          (.F?....o???>.  
orangepipc2:~:% sudo i2cdump -r 0x01-0x2d 0 0x55 w
orangepipc2:~:% sudo i2cdump -y -r 0x02-0x2d 0 0x55 W
     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f    0123456789abcdef
00:       00 00 ff ff 71 0b 66 0f 80 01 13 06 27 09      ....q?f?????'?
10: 02 05 16 08 00 00 ff ff ff ff ff ff ff ff 8a f8    ????..........??
20: 28 00 46 12 00 00 ff ff 6f 0b c0 03 3e 00          (.F?....o???>.  
orangepipc2:~:% sudo i2cdump -y -r 0x02-0x2d 0 0x55 W
     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f    0123456789abcdef
00:       00 00 ff ff 71 0b 66 0f 80 01 13 06 27 09      ....q?f?????'?
10: 02 05 16 08 00 00 ff ff ff ff ff ff ff ff 8a f8    ????..........??
20: 28 00 46 12 00 00 ff ff 6f 0b c0 03 3e 00          (.F?....o???>.  
orangepipc2:~:% sudo i2cdump -y -r 0x02-0x2d 0 0x55 W
     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f    0123456789abcdef
00:       00 00 ff ff 71 0b 66 0f 80 01 13 06 27 09      ....q?f?????'?
10: 02 05 16 08 00 00 ff ff ff ff ff ff ff ff 8a f8    ????..........??
20: 28 00 46 12 00 00 ff ff 6e 0b c0 03 3e 00          (.F?....n???>.  
orangepipc2:~:% sudo i2cdump -y -r 0x02-0x2d 0 0x55 w
     0,8  1,9  2,a  3,b  4,c  5,d  6,e  7,f
00:           0000 ff00 ffff 71ff 0b71 660b 
08: 0f66 800f 0180 1301 0613 2706 0927 0209 
10: 0502 1605 0816 0008 0000 ff00 ffff ffff 
18: ffff ffff ffff ffff ffff 8aff f88a 28f8 
20: 0028 4600 1246 0012 0000 ff00 ffff 6eff 
28: 0b6e c00b 03c0 3e03 003e 4f00           
orangepipc2:~:% sudo i2cdump -y -r 0x02-0x2d 0 0x55 w
     0,8  1,9  2,a  3,b  4,c  5,d  6,e  7,f
00:           0000 ff00 ffff 71ff 0b71 660b 
08: 0f66 800f 0180 1301 0613 2706 0927 0209 
10: 0502 1605 0816 0008 0000 ff00 ffff ffff 
18: ffff ffff ffff ffff ffff 8aff f88a 28f8 
20: 0028 4600 1246 0012 0000 ff00 ffff 6eff 
28: 0b6e c00b 03c0 3e03 003e 4f00           
orangepipc2:~:% man i2cdump                          
orangepipc2:~:% i2cdump -r 0x01-0x2d 0 0x55 b
Error: Could not open file `/dev/i2c-0': Permission denied
Run as root?
orangepipc2:~:% i2cdump -r 0x01-0x2d 0 0x55 b     
orangepipc2:~:% sudo i2cdump -y -r 0x02-0x2d 0 0x55 b
     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f    0123456789abcdef
00:       00 00 ff ff 71 0b 66 0f 80 01 13 06 27 09      ....q?f?????'?
10: 02 05 16 08 00 00 ff ff ff ff ff ff ff ff 8a f8    ????..........??
20: 28 00 46 12 00 00 ff ff 6e 0b c0 03 3e 00          (.F?....n???>.  
orangepipc2:~:% sudo i2cdump -y -r 0x02-0x2d 0 0x55 w
     0,8  1,9  2,a  3,b  4,c  5,d  6,e  7,f
00:           0000 ff00 ffff 71ff 0b71 660b 
08: 0f66 800f 0180 1301 0613 2706 0927 0209 
10: 0502 1605 0816 0008 0000 ff00 ffff ffff 
18: ffff ffff ffff ffff ffff 8aff f88a 28f8 
20: 0028 4600 1246 0012 0000 ff00 ffff 6eff 
28: 0b6e c00b 03c0 3e03 003e 4f00           
orangepipc2:~:% sudo i2cdump -y -r 0x02-0x2d 0 0x55 W
     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f    0123456789abcdef
00:       00 00 ff ff 71 0b 66 0f 80 01 13 06 27 09      ....q?f?????'?
10: 02 05 16 08 00 00 ff ff ff ff ff ff ff ff 8a f8    ????..........??
20: 28 00 46 12 00 00 ff ff 6e 0b c0 03 3e 00          (.F?....n???>.  
orangepipc2:~:% i2cget -h
Error: Unsupported option "-h"!
Usage: i2cget [-f] [-y] [-a] I2CBUS CHIP-ADDRESS [DATA-ADDRESS [MODE]]
  I2CBUS is an integer or an I2C bus name
  ADDRESS is an integer (0x03 - 0x77, or 0x00 - 0x7f if -a is given)
  MODE is one of:
    b (read byte data, default)
    w (read word data)
    c (write byte/read byte)
    Append p for SMBus PEC
orangepipc2:~:% sudo i2cget -y 0 0x55 0x08
0x66
orangepipc2:~:% sudo i2cget -y 0 0x55 0x08 w
0x0f66
orangepipc2:~:% sudo i2cget -y 0 0x55 0x08 w
0x0f66
orangepipc2:~:% sudo i2cget -y 0 0x55 0x2c w
0x003e
orangepipc2:~:% py
zsh: command not found: py
orangepipc2:~:% python3
Python 3.8.5 (default, Jan 27 2021, 15:41:15) 
[GCC 9.3.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> import smbus
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
ModuleNotFoundError: No module named 'smbus'
>>> 
KeyboardInterrupt
>>> 
orangepipc2:~:% sudo apt search smbus
Sorting... Done
Full Text Search... Done
python3-smbus/focal 4.1-2build2 arm64
  Python 3 bindings for Linux SMBus access through i2c-dev

orangepipc2:~:% sudo apt install python3-smbus
Reading package lists... Done
Building dependency tree       
Reading state information... Done
The following NEW packages will be installed:
  python3-smbus
0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.
Need to get 7,296 B of archives.
After this operation, 35.8 kB of additional disk space will be used.
Get:1 http://ports.ubuntu.com focal/universe arm64 python3-smbus arm64 4.1-2build2 [7,296 B]
Fetched 7,296 B in 0s (63.1 kB/s)         
Selecting previously unselected package python3-smbus:arm64.
(Reading database ... 37843 files and directories currently installed.)
Preparing to unpack .../python3-smbus_4.1-2build2_arm64.deb ...
Unpacking python3-smbus:arm64 (4.1-2build2) ...
Setting up python3-smbus:arm64 (4.1-2build2) ...
orangepipc2:~:% python3
Python 3.8.5 (default, Jan 27 2021, 15:41:15) 
[GCC 9.3.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> import smbus
>>> b = smbus.SMBus(0)
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
PermissionError: [Errno 13] Permission denied
>>> 
KeyboardInterrupt
>>> 
orangepipc2:~:% sudo python3
Python 3.8.5 (default, Jan 27 2021, 15:41:15) 
[GCC 9.3.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> import smbus
>>> b = smbus.SMBus(0)
>>> b.read_
b.read_block_data(      b.read_byte(            b.read_byte_data(       b.read_i2c_block_data(  b.read_word_data(       
>>> b.read_word_data(0x55, 0x8)
3942
>>> b.read_word_data(0x55, 0x2c)
62
>>> b.read_byte_data(0x55, 0x2c)
62
>>> b.read_byte_data(0x55, 0x8)
102
>>> b.read_byte_data(0x55, 0x6)
112
>>> b.read_word_data(0x55, 0x6)
2928
>>> x = b.read_word_data(0x55, 0x6)
>>> x
x
>>> type(x)
<class 'int'>
>>> x / 10 - 273.1
19.69999999999999
>>>
```

# Writing Device Tree Overlays
https://docs.armbian.com/User-Guide_Armbian_overlays/
https://github.com/armbian/sunxi-DT-overlays/tree/master/examples
https://elinux.org/Device_Tree_Reference

https://elixir.bootlin.com/linux/v5.10.23/source/Documentation/devicetree/overlay-notes.rst
https://elixir.bootlin.com/linux/v5.10.23/source/Documentation/devicetree/bindings/power/supply/battery.txt
https://elixir.bootlin.com/linux/v5.10.23/source/Documentation/devicetree/bindings/power/supply/bq27xxx.yaml

`i2c-bq27541.dts`
```dts
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

`armbian-add-overlay` ist just a shell script. It calls `dtc`(Device Tree Compiler) then copies the result to `/boot/overlay-user/i2c-bq27541.dtbo` and enables it in `/boot/armbianEnv.txt`.

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