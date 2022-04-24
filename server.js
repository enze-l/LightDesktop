const express = require('express')
const shell = require("shelljs");
const bodyParser = require('body-parser')
const axios = require("axios");
const app = express()
app.use(bodyParser.text({type:"*/*"}))

const serverAddress = "http://192.168.2.64:50000"

const port = 8081
let display_brightness = 1
let display_min = .5
let display_max = 1
let display_threshold_min = 50
let display_threshold_max = 300
let lighting_history = []
// has to be lower/equal 100
let avgArrayLength = 60

function setBrightness(brightness){
    if (display_brightness !== brightness) {
        display_brightness = brightness
        const displayInfoArray = String(
            shell.exec("xrandr --prop", {silent: true})).split(/(\s+)/).filter(e => e.trim().length > 0
        )
        const displayName = displayInfoArray[displayInfoArray.indexOf("connected") - 1]
        shell.exec("xrandr --output " + displayName + " --brightness " + brightness)
    }
}

function setAutoBrightness(){
    const average = arr => arr.reduce((a,b) => a + b, 0) / arr.length
    const lightAverage = average(lighting_history).toFixed(0)
    console.log(lightAverage)
    console.log(display_threshold_max)
    console.log(display_threshold_min)
    if(lightAverage < display_threshold_min){
        setBrightness(display_min)
        console.log("Low Value")
    }
    else if(lightAverage > display_threshold_max){
        setBrightness(display_max)
        console.log("Hig Value")
    } else {
        const displayRange = display_max - display_min
        const displayThresholdRange = display_threshold_max - display_threshold_min
        const rangeAdjustedAverage = lightAverage - display_threshold_min;

        const brightness = display_min + ( rangeAdjustedAverage / displayThresholdRange ) * displayRange
        setBrightness(brightness)
        console.log("Regulating")
    }
}

function getRespondAndLog(req, res, body){
    res.send(String(body))
    console.log("get " + req.path + " value: " + body)
}

function postRespondAndLog(req, res){
    res.sendStatus(204);
    console.log("post " + req.path + " value: " + req.body)
}

//display
//display brightness
app.post('/display/brightness',(req, res) =>{
    setBrightness(req.body)
    postRespondAndLog(req, res)
})
app.get('/display/brightness',(req, res) =>{
    getRespondAndLog(req, res, display_brightness)
})
//display min
app.post('/display/min',(req, res) =>{
    display_min = parseFloat(req.body)
    postRespondAndLog(req, res)
})
app.get('/display/min',(req, res) =>{
    getRespondAndLog(req, res, display_min)
})
//display max
app.post('/display/max', (req, res) => {
    display_max = parseFloat(req.body)
    postRespondAndLog(req, res)
})
app.get('/display/max',(req, res) =>{
    getRespondAndLog(req, res, display_max)
})
//display threshold min
app.post('/display/threshold/min',(req, res) =>{
    display_threshold_min = parseInt(req.body)
    postRespondAndLog(req, res)
})
app.get('/display/threshold/min',(req, res) =>{
    getRespondAndLog(req, res, display_threshold_min)
})

//display threshold max
app.post('/display/threshold/max', (req, res) => {
    display_threshold_max = parseInt(req.body)
    postRespondAndLog(req, res)
})
app.get('/display/threshold/max',(req, res) =>{
    getRespondAndLog(req, res, display_threshold_max)
})

//sensor
app.get('/sensor', async (req, res) =>{
    const response = await axios.get(serverAddress + "/reading")
    getRespondAndLog(req, res, response.data)
})

app.post('/sensor', async (req, res)=>{
    postRespondAndLog(req, res)
    const number = parseInt(req.body.replace( /^\D+/g, ''))
    lighting_history.push(number)
    if(lighting_history.length > avgArrayLength) {
        lighting_history.shift()
    }
    setAutoBrightness()
})
app.get('/sensor/max', async (req, res) => {
    const response = await axios.get(serverAddress + "/reading/max")
    getRespondAndLog(req, res, response.data)
})
app.get('/sensor/day', async (req, res) => {
    const response = await axios.get(serverAddress + "/list/day")
    getRespondAndLog(req, res, response.data)
})
app.get('/sensor/100', async (req, res) => {
    const response = await axios.get(serverAddress + "/list/100")
    const lighting_history_100 = response.data.split(/(\s+)/).filter(e => e.trim().length > 0).map(function(item) {
        return parseInt(item, 10);
    });
    lighting_history = lighting_history_100.slice(100-avgArrayLength)
    getRespondAndLog(req, res, response.data)
})

app.listen(port, '0.0.0.0', () => console.log(`Listening on port ${port}..`))