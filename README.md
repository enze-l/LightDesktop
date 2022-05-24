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

