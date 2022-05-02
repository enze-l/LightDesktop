const express = require('express')
const http = require('http')
const shell = require("shelljs")
const bodyParser = require('body-parser')
const axios = require('axios')
const fs = require('fs')
const ip = require('ip')
const socketIo = require('socket.io')

const app = express()
app.use(bodyParser.text({type:"*/*"}))
const server = http.createServer(app)
const io = socketIo(server)

const serverAddress = "http://192.168.2.64:50000"
const ownAddress = ip.address()
const port = 8081

let settings =
{
    display_min: .5,
    display_max: 1,
    display_threshold_min: 50,
    display_threshold_max: 300,
    avgArrayLength: 50
}
let display_brightness = 1
let lighting_history = []

io.on("connection", (socket) =>{
    console.log("client connected")
    socket.on("disconnect", () =>{
        console.log("client disconnected")
    })
})

function loadSettings(){
    let rawData = fs.readFileSync('./savestate.json')
    settings = JSON.parse(rawData)
    console.log(settings)
}

function saveSettings(){
    let data = JSON.stringify(settings, null, 2)
    fs.writeFileSync('./savestate.json', data)
}

function subscribeToSensor(){
    axios.post(serverAddress + '/subscriber/' + ownAddress + ":" + port).then()
}

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
    let lighting_history_clone = [...lighting_history]
    if(lighting_history_clone.length<100){
        const frontFiller = Array(100-lighting_history_clone.length).fill(lighting_history_clone[0])
        lighting_history_clone = frontFiller.concat(lighting_history_clone)
    }
    const lightAverage = average(lighting_history_clone.splice(100-settings.avgArrayLength)).toFixed(0)
    if(lightAverage < settings.display_threshold_min){
        setBrightness(settings.display_min)
        console.log("Low Value")
    }
    else if(lightAverage > settings.display_threshold_max){
        setBrightness(settings.display_max)
        console.log("Hig Value")
    } else {
        const displayRange = settings.display_max - settings.display_min
        const displayThresholdRange = settings.display_threshold_max - settings.display_threshold_min
        const rangeAdjustedAverage = lightAverage - settings.display_threshold_min;

        const brightness = settings.display_min + ( rangeAdjustedAverage / displayThresholdRange ) * displayRange
        setBrightness(brightness)
        console.log("Regulating")
    }
}

async function getLightingHistory(){
    const response = await axios.get(serverAddress + "/list/100")
    lighting_history = response.data.split(/(\s+)/).filter(e => e.trim().length > 0).map(function(item) {
        return parseInt(item, 10);
    });
    return response
}

function getRespondAndLog(req, res, body){
    res.send(String(body))
    saveSettings()
    console.log("get " + req.path + " value: " + body)
}

function postRespondAndLog(req, res){
    res.sendStatus(204)
    saveSettings()
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
    settings.display_min = parseFloat(req.body)
    postRespondAndLog(req, res)
})
app.get('/display/min',(req, res) =>{
    getRespondAndLog(req, res, settings.display_min)
})
//display max
app.post('/display/max', (req, res) => {
    settings.display_max = parseFloat(req.body)
    postRespondAndLog(req, res)
})
app.get('/display/max',(req, res) =>{
    getRespondAndLog(req, res, settings.display_max)
})
//display max
app.post('/display/intervalLength', (req, res) => {
    settings.avgArrayLength = parseFloat(req.body)
    postRespondAndLog(req, res)
})
app.get('/display/intervalLength',(req, res) =>{
    getRespondAndLog(req, res, settings.avgArrayLength)
})
//display threshold min
app.post('/display/threshold/min',(req, res) =>{
    const value = parseInt(req.body)
    if (value) {
        settings.display_threshold_min = value
    } else {
        settings.display_threshold_min = 0
    }
    postRespondAndLog(req, res)
})
app.get('/display/threshold/min',(req, res) =>{
    getRespondAndLog(req, res, settings.display_threshold_min)
})

//display threshold max
app.post('/display/threshold/max', (req, res) => {
    settings.display_threshold_max = parseInt(req.body)
    postRespondAndLog(req, res)
})
app.get('/display/threshold/max',(req, res) =>{
    getRespondAndLog(req, res, settings.display_threshold_max)
})

//sensor
app.get('/sensor', async (req, res) =>{
    const response = await axios.get(serverAddress + "/reading")
    getRespondAndLog(req, res, response.data)
})

app.post('/sensor', async (req, res)=>{
    const number = parseInt(req.body.replace( /^\D+/g, ''))
    lighting_history.push(number)
    while(lighting_history.length > 100) {
        lighting_history.shift()
    }
    postRespondAndLog(req, res)
    setAutoBrightness()
    io.emit("reading", number)
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
    getRespondAndLog(req, res, lighting_history.join(" "))
})

loadSettings()
subscribeToSensor()
getLightingHistory().then()
server.listen(port, '0.0.0.0', () => console.log(`Listening on port ${port}..`))
