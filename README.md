# LightDesktop
A service designed to dimm the screen-brightness of a unix computer based on the readings of a network connected light
sensor. It serves a locally accessible web-interface to control its parameters. The software running on the sensor can
be found in this repository: https://github.com/enze-l/LightServer

# Usage
## dependencies
- node
- xrandr 
 
Node is used for running the service while xrandr is a utility used for dimming a screen software based.

## install
- clone this repository
- install the node dependencies via  
```npm i```
- build the service via  
```npm run build```

## run
```node light-desktop.js <IP of your sensor>```

## control
With the service running you can go to ```http://localhost:8081``` where you are served with an interface like this:

![Alt text](public/documentation/interface.png?raw=true "Interface")

With this interface you can tune the settings of the service to you liking.
### Explanation
***Graph:***
The graph on top shows lighting related data to give some perspective for the settings. The yellow line signals the
highest ever recorded brightness of the sensor. The blue graph continually display the last 100 readings of the sensor
in realtime. The white line displays the readings of the last 24 hours.

***Vertical Slider:*** The vertical slider on the right lets you chose in which brightness intervall the display should
be dimmed. The lower handle signals the point at which the display should be as dark as possible and the higher handle
signals at which point it should be as bright as possible.

***Horizontal Sliders:***
1. the "attack delay" says how quickly the brightness gets dimmed. A higher value generally makes for a smoother
transition but also reacts slower to changes in brightness.
2. the "brightness range" defines how dimm and bright your display should get. The lower limit is capped to 10% for
safety reasons (0% would be total black. 10% is barely readable).
3. the "manuel brightness" lets you play with the brightness of the display. If you move it the automatic brightness
control gets switched off so remember to turn it on again.

***Toggle Switch***
The toggle switch on the bottom right toggles between automatic operation (blue) and manuel operation (grey)

Tipp: Modern browsers support saving websites to the desktop where they are displayed as app-icons. Doing so makes
using the control-panel more seamless.

# Working Principle

The network sensor serves different endpoints from which various parameters, like the last 100 readings, the current
brightness and the maximal recorded brightness can be retrieved. Furthermore, it can serve its most recent readings via 
an observer pattern. The exact API can be found under: https://github.com/enze-l/LightServer

This service tabs into this sensor and uses its data to control the brightness of the display. This is done via the
dependency "xrandr" which can dimm a display via software and works independently of display drivers or graphics drivers.
An essential part of this process is the npm module "shelljs" which enables a js-script to execute shell commands.
All settings of the service are saved and retrieved from the file "savestate.json". While it is possible to change the
settings via this file prior to execution, it is recommended to rather use the web-interface which the service serves
locally under "localhost:8081".

The interface is upon react and communicates with the service via REST-Endpoint and Websockets. Almost all settings and
data is retrieved via REST-Endpoint. The only usage for the Websockets is to communicate the realtime data between
the service and the interface.
