# LightDesktop
A service designed to dimm the screen-brightness of a unix computer based on the readings of a network connected light
sensor. It serves a locally accessible web-interface to control its parameters. The software running on the sensor can
be found in this repository: https://github.com/enze-l/LightServer

***warning:*** The sensor currently saves the connection data for your network in plain text! Do not use this project if you do not understand why this is a security vulnerability!

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

# From Concept to Result

## Motivation
I am sitting in front of a desktop computer at varying times of the day. While my screen is not directly hit by sunshine, I still often times feel the urge to adjust its brightness to not feel blinded by it at night. While my laptop and phone do dimm their screens according to the environment, I was not able to find a comparable package of software and hardware for desktop screens. The lack of options led me to designing this system which should dimm the screen according to my own specification and should be adjustable on the fly.

## Initial Idea
The first idea was to have a network connected sensor and to connect to it via a command line interface where you could see reference data in form of ascii-charts and set your configuration parameters.

In order for this concept to succeed some questions had to be cleared first:

- How can I serve multiple clients from a microcontroller simultaneously?
- How do I connect and utilize a brightness sensor with a microcontroller?
- How do I change parameters of a running service?

One of my goals was to reduce the amount of dependencies a user would have to install by himself. I found this to be a source of complication and frustration for many small projects I wanted to experiment with myself.

## Implementation and Research

### Introduction
While thinking about the project no big obstacle came to my mind. Rather there were many small things I had to implement and in order to be effective about it, I wanted to reduce the amount of code I had to write by myself. To realise that goal I had to research for a lot of libraries and frameworks.

At the same time I didn't want to invest a lot of time before starting to implement just to later realize that I made a mistake in the concept and other things won't work because of it. Because of that I started with the things I thought would have to be addressed as quickly as possible to validate my concept or which would make the biggest impact on the project. After that I broke the project up into the server and client side and later even further and addressed all of them first in sequence and later wherever I saw the most value. 

### Validation
The first thing I had to figure out was how to dimm a screen independently of the underlying hardware. The program 'xrandr' did exactly that.

The second thing I needed to know was which light sensor I would need to buy, how to connect it physically and how to interface with it in software. While researching I stumbled upon the website "Awesome MicroPython" which held a compilation of a lot of libraries and frameworks for micropython. Another search for the availability of light sensor brought me to the "bh1750". This is a light sensor with an digital interface via I2C. It seemed ideal for the project because of its small price (2,20€ at the time of writing), availability and its good documentation and easy way of interfacing via the following library: https://github.com/PinkInk/upylib/tree/master/bh1750

The last thing I needed to know was how to serve multiple clients reliably. Awesome Micropython had a whole assortment of webservers available from which I chose the one I thought was the easiest to use: [tinyweb](https://github.com/belyalov/tinyweb)

### Implementation
***Sensor***

I started with the implementation on the sensor side. First I implemented reading sensor-data. Afterwards I thought about which information would be interesting for clients. The average consumer has no knowledge of what "lux" means and therefore has no frame of reference for any values the sensor might produce. Therefore, I collected some more information that might be useful. Among it are the last 100 readings, readings of the last 24 hours as well as the highest ever recorded value and the lowest one. Afterwards I made them accessible via http endpoints. One other important aspekt was to deliver real-time readings. Of course polling the most recent reading would be an option, but it could lead to inconsistent updates if the polling rate is not exactly synchronous with the reading time of the sensor. One obvious solution would have been to use websockets, but unfortunately there wasn't a straight forward implementation for micropython I could find. Instead, I settled for a publisher-subscriber pattern where clients would initially submit their own Ip and Port for receiving up-to-date readings. The readings are then delivered via standard http. 

***Service***

I started out by figuring out how to display data in an ascii chart. While researching I stumbled upon node based approaches. Especially [asciichart](https://www.npmjs.com/package/asciichart) seemed to be an accessible option. This made me reevaluate my approach to use a shell-script to run a service. My main concern with using node was that I would not be able to change the brightness of the screen because it would necessitate access to the shell. This was shortly after rectified once I had discovered [shelljs](https://www.npmjs.com/package/shelljs) which enabled this kind of access.

Using node made things much easier. With prior experience I was quickly able to display data in ascii-form by utilizing [axios](https://www.npmjs.com/package/axios) to get the data of the sensor.

At the time the state of the programm was to run it, it would display the recent readings and then exit itself. But what I actually needed was a service that would run continuously. This raised the question on how to interact with that service to change parameters while it was running. The most forward solution to this problem was for me to decouple the service that would dimm the screen from the interface that would set the parameters and make them communicate via ports. With more knowledge about displaying data I decided it would be more intuitive to have a graphical interface instead of the command line interface I had originally planed.

I decided to flesh out the service more before advancing to the interface. I implemented some endpoints via [express](https://www.npmjs.com/package/express) that would simply pass on the information from the sensor to the interface. Furthermore, I implemented endpoints that would pass on the current state of the clients settings like the currently set brightness, the range of brightness and the threshold for regulating the brightness. I made the service safe and retrieve those settings to and from a json file. I waited for the implementation of the realtime-data for after the interface was established because it was more of a "nice-to-have" feature.

***Interface***

Since I had only experience with react it was a natural choice as a framework for a frontend application. I started out with reading the information of the service via [axios](https://www.npmjs.com/package/axios) and displaying it via [recharts](https://recharts.org/en-US/). I decided for me, it would be intuitiv to set the necessary values via sliders. The easiest implementation was for me to use [Material-UI](https://mui.com/) Components for that. For quick styling I decided to use [tailwindcss](https://tailwindcss.com/) which makes designing a website less verbose.

The only feature left was to display the reading of the sensor continuously. I decided to use [Socket.IO](https://socket.io/) for this as it enabled the use of websockets with minimal boilerplate code.

One last step was for me to convert the interface to an [electron](https://www.electronjs.org/) app. Shortly after I did this I reversed that decision because it would require to now install two independent application which would increase complexity for the enduser and risk diverging versions if a user wouldn't update both apps at the same time. Instead of a native App I settled for bundling the interface with the service and providing it as a local webservice. In order for users to still have the "native-feeling" of an app I added a few lines in the documentation for how to save a desktop shortcut for running a webservice that would accomplish almost the same thing.

## Retrospection
I have met the requirements that I set out to achieve and even improved on them by providing a graphical interface instead of a command line interface. Stil there is room for improvement:
1. Tweaking the settings in order to get a satisfying experience is tedious, even with the graphical interface. I now understand why no operating system exposes those details to the enduser because it requires them to actively monitor their own experience and make tweaks accordingly. A better way would be to utilize some algorithm to set those parameters automatically, or even better, train an AI in the background to do so. Both of these approaches are beyond the scope of this project.
2. I could not figure out in an appropriate amount of time how to safe the ssid and password of a wireless network securely on the esp32 without having to reconnect it manually after each reboot. Therefore, this information is saved in plain text and would be easy to retrieve for any intruder with enough technical knowledge. This is why there is a warning in the introduction of this project.

My development journey was one of the more enjoyable ones. There wasn't any big conceptual gaps I had to first fill in order to start implementing. With so many components it still was a lot of work and my own summary glances over a lot of smaller technical challenges I had to overcome. I am happy with the result and confident that my approach, using as many frameworks as possible to lift the load of my shoulders, was the right on. 
