import {XAxis, YAxis, Area, ComposedChart, Line} from "recharts";
import {Box, Slider, Switch, ThemeProvider} from "@mui/material";
import React, {useState, useEffect, useRef} from "react";
import Sensor from "./sensor"
import Display from "./display";
import socketIOClient from "socket.io-client"
import {createTheme} from "@mui/material/styles";
import {grey, blue} from "@mui/material/colors";

const serverAddress = "http://localhost:8081"
const textColor = "#6B7280"
const graphColor = "#6faeff"
const maxColor = "#ffdd00"
const dayColor = "#6B7280"
const currentColor = "#6faeff"
const sensor = new Sensor(serverAddress)
const display = new Display(serverAddress)
const theme = createTheme({
    palette: {
        primary: {
            main: blue[300]
        },
        secondary: {
            main: grey[500]
        }
    }
})

function App() {
    const [graphData, setGraphData] = useState([])
    const [dayData, setDayData] = useState([])
    const [displayBrightnessRange, setDisplayBrightnessRange] = useState([10, 100])
    const [displayThresholdRange, setDisplayThresholdRange] = useState([1, 500])
    const [displayBrightness, setDisplayBrightness] = useState(100)
    const [averageInterval, setAverageInterval] = useState(100)
    const [maxSensorBrightness, setMaxSensorBrightness] = useState(0)
    const [graphScaleY, setGraphScaleY] = useState(50)
    const [autoSwitch, setAutoSwitch] = useState(false)
    const lastHundredValues = useRef([]);
    const dayValues = useRef([]);

    useEffect(() => {
        Promise.all([
            sensor.getHundredValues(),
            sensor.getMaxBrightness(),
            sensor.getCurrentBrightness(),
            display.getMaxThreshold(),
            display.getMinThreshold(),
            display.getMaxBrightness(),
            display.getMinBrightness(),
            display.getBrightness(),
            display.getIntervalLength(),
            display.getAuto(),
            sensor.getDayValues()
        ]).then((results) => {
            lastHundredValues.current = String(results[0].data).split(/(\s+)/).filter(e => e.trim().length > 0)
            const maxBrightness = results[1].data
            setDisplayThresholdRange([results[4].data, results[3].data])
            setDisplayBrightnessRange([results[6].data * 100, results[5].data * 100])
            setDisplayBrightness(results[7].data * 100)
            setAverageInterval(results[8].data)
            setAutoSwitch(results[9].data)
            setMaxSensorBrightness(maxBrightness)
            reactToYAxisChange(maxBrightness, results[3].data)
            dayValues.current = String(results[10].data).split(/(\s+)/).filter(e => e.trim().length > 0)
            setGraphData(convertArrayToObjects(lastHundredValues.current, maxBrightness, results[2].data))
            setDayData(convertDayValuesToObjects(dayValues.current))
        })
    }, [])

    useEffect(() => {
        const socket = socketIOClient(serverAddress)
        socket.on("reading", (msg) => {
            const currentLevel = msg.toString()
            const currentHundredValues = [...lastHundredValues.current]
            currentHundredValues.shift()
            currentHundredValues.push(currentLevel)
            lastHundredValues.current = currentHundredValues
            if (currentLevel > maxSensorBrightness) {
                setMaxSensorBrightness(msg)
                setGraphData(convertArrayToObjects(
                        lastHundredValues.current, currentLevel.toString(), currentLevel.toString()
                    ))
            } else {
                setGraphData(convertArrayToObjects(
                        lastHundredValues.current, maxSensorBrightness, currentLevel.toString()
                    ))
            }
        })
        return () => {
            socket.off()
        }
    }, [maxSensorBrightness])

    function reactToYAxisChange(value1, value2) {
        setGraphScaleY(Math.round(Math.max(value1, value2) * 1.15))
    }

    function convertDayValuesToObjects(days) {
        let dayArray = []
        days.forEach(element => dayArray.push({day: element}))
        return dayArray
    }

    function convertArrayToObjects(hundreds, max, current) {
        let graphArray = []
        hundreds.forEach( element => graphArray.push({hundred: element, current: current, max: max}))
        return graphArray
    }

    const changeAutoValue = (e, val) => {
        if (val) {
            setAutoSwitch(true)
            display.setAuto(true)
        } else {
            display.setBrightness(displayBrightness)
            setAutoSwitch(false)
            display.setAuto(false)
        }
    }

    return (
        <ThemeProvider theme={theme}>
            <div className="App">
                <header className="App-header min-h-screen bg-gray-800">
                    <div className="grid place-items-center">
                        <div className="flex flex-row mt-8">
                            <ComposedChart width={500} height={300} data={graphData}>
                                <defs>
                                    <linearGradient id="brightness" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={graphColor} stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor={graphColor} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <YAxis domain={[0, graphScaleY]} stroke={textColor}/>
                                <XAxis xAxisId={"current"} hide={true}/>
                                <XAxis xAxisId={"day"} hide={true}/>
                                <Area xAxisId={"current"} dot={false} isAnimationActive={false} type="monotone" dataKey="hundred"
                                      stroke={textColor} fill="url(#brightness)"/>
                                <Line xAxisId={"current"} dot={false} type="monotone" dataKey="max" stroke={maxColor}/>
                                <Line xAxisId={"day"} dot={false} type="monotone" data={dayData} dataKey="day" stroke={dayColor}/>
                                <Line xAxisId={"current"} dot={false} type="monotone" dataKey="current" stroke={currentColor}/>
                            </ComposedChart>
                            <div className="pl-8 pb-2 pt-2">
                                <Slider
                                    size="small"
                                    min={0}
                                    max={graphScaleY}
                                    orientation="vertical"
                                    valueLabelDisplay="auto"
                                    value={displayThresholdRange}
                                    onChange={(e, value) => {
                                        setDisplayThresholdRange(value)
                                    }}
                                    onChangeCommitted={(e, value) => {
                                        display.setMinThreshold(value[0])
                                        display.setMaxThreshold(value[1])
                                        reactToYAxisChange(value[1], maxSensorBrightness)
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex flex-row pl-3 pt-4">
                            <Box width={500} className="pl-16">
                                <p className="text-gray-500">attack delay</p>
                                <Slider
                                    size="small"
                                    min={1}
                                    max={100}
                                    valueLabelDisplay="off"
                                    value={averageInterval}
                                    onChange={(e, value) => setAverageInterval(value)}
                                    onChangeCommitted={(e, value) => {
                                        display.setIntervalLength(value)
                                    }}
                                />
                                <p className="text-gray-500">brightness range</p>
                                <Slider
                                    size="small"
                                    min={10}
                                    max={100}
                                    valueLabelDisplay="auto"
                                    value={displayBrightnessRange}
                                    onChange={(e, value) => setDisplayBrightnessRange(value)}
                                    onChangeCommitted={(e, value) => {
                                        display.setMinBrightness(value[0])
                                        display.setMaxBrightness(value[1])
                                    }}
                                />
                                <p className="text-gray-500">manuel brightness</p>
                                <Slider
                                    size="small"
                                    track={false}
                                    color={"secondary"}
                                    min={10}
                                    max={100}
                                    valueLabelDisplay="auto"
                                    value={displayBrightness}
                                    onChange={(e, value) => setDisplayBrightness(value)}
                                    onChangeCommitted={(e, value) => {
                                        display.setBrightness(value)
                                        setAutoSwitch(false)
                                        display.setAuto(false)
                                    }}
                                />
                            </Box>
                            <div className="ml-5 mb-2 mt-5 grid place-items-center">
                                <Switch className="-rotate-90" checked={autoSwitch} onChange={changeAutoValue}/>
                            </div>
                        </div>
                    </div>
                </header>
            </div>
        </ThemeProvider>
    );
}

export default App;
