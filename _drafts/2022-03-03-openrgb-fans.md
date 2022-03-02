---
layout: post
title: "Mainboard RGB Fan Control with OpenRGB"
tags: software rgb led mod
---
Finally following up my previous [post about the coolmoon controller mod]({% post_url 2019-06-11-re-coolmoon-rgb-controller %}), this post shows how to connect it with a mainboard header and do impressive animation with OpenRGB.

# Hardware Setup
## Mainboard Connection

## Additional 3D printed sign
![JK sign cad model](/assets/openrgb/sign-cad.png)
Overall 17 LEDs (6+5+6)


# OpenRGB configuration
## Plugins
![OpenRGB settings plugin install](/assets/openrgb/plugins.png)
https://gitlab.com/OpenRGBDevelopers/OpenRGBVisualMapPlugin
https://gitlab.com/OpenRGBDevelopers/OpenRGBEffectsPlugin

## Fans + sign
![OpenRGB resize device](/assets/openrgb/main-resize.png)
## WLED
![OpenRGB DMX device](/assets/openrgb/e1-31.png)
![WLED DMX server](/assets/openrgb/wled-dmx.png)

## Positional mapping
![OpenRGB visual map](/assets/openrgb/mapping.png)
![OpenRGB visual map custom shape](/assets/openrgb/custom-shape.png)
![OpenRGB virtual device](/assets/openrgb/virtual.png)

## Effects
![OpenRGB audio effects](/assets/openrgb/effects.png)

# Demo Video