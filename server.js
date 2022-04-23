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

function setBrightness(brightness){
    display_brightness = brightness
    const displayInfoArray = String(
        shell.exec("xrandr --prop", { silent: true })).split(/(\s+)/).filter( e => e.trim().length > 0
    )
    const displayName = displayInfoArray[displayInfoArray.indexOf("connected") - 1]
    shell.exec("xrandr --output " + displayName + " --brightness " + brightness)
}

function getAndLog(req, res, body){
    res.send(String(body))
    console.log("get " + req.path + " value: " + body)
}

function postAndLog(req, res){
    res.sendStatus(204);
    console.log("post " + req.path + " value: " + req.body)
}

//display
//display brightness
app.post('/display/brightness',(req, res) =>{
    setBrightness(req.body)
    postAndLog(req, res)
})
app.get('/display/brightness',(req, res) =>{
    getAndLog(req, res, display_brightness)
})
//display min
app.post('/display/min',(req, res) =>{
    display_min = req.body
    postAndLog(req, res)
})
app.get('/display/min',(req, res) =>{
    getAndLog(req, res, display_min)
})
//display max
app.post('/display/max', (req, res) => {
    display_max = req.body
    postAndLog(req, res)
})
app.get('/display/max',(req, res) =>{
    getAndLog(req, res, display_max)
})
//display threshold min
app.post('/display/threshold/min',(req, res) =>{
    display_threshold_min = req.body
    postAndLog(req, res)
})
app.get('/display/threshold/min',(req, res) =>{
    getAndLog(req, res, display_threshold_min)
})

//display threshold max
app.post('/display/threshold/max', (req, res) => {
    display_threshold_max = req.body
    postAndLog(req, res)
})
app.get('/display/threshold/max',(req, res) =>{
    getAndLog(req, res, display_threshold_max)
})

//sensor
app.get('/sensor', async (req, res) =>{
    const response = await axios.get(serverAddress + "/reading")
    getAndLog(req, res, response.data)
})
app.post('/sensor', async (req, res)=>{
    console.log("IMPORTANT" + req.body)
})
app.get('/sensor/max', async (req, res) => {
    const response = await axios.get(serverAddress + "/reading/max")
    getAndLog(req, res, response.data)
})
app.get('/sensor/day', async (req, res) => {
    const response = await axios.get(serverAddress + "/list/day")
    getAndLog(req, res, response.data)
})
app.get('/sensor/100', async (req, res) => {
    const response = await axios.get(serverAddress + "/list/100")
    getAndLog(req, res, response.data)
})

app.listen(port, '0.0.0.0', () => console.log(`Listening on port ${port}..`))