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

function setBrightness(brightness){
    display_brightness = brightness
    const displayInfoArray = String(
        shell.exec("xrandr --prop", { silent: true })).split(/(\s+)/).filter( e => e.trim().length > 0
    )
    const displayName = displayInfoArray[displayInfoArray.indexOf("connected") - 1]
    shell.exec("xrandr --output " + displayName + " --brightness " + brightness)
}

function sendSuccess(res){
    res.sendStatus(204)
}

async function getHundredValues(){
    const response = await axios.get(serverAddress + "/list/100")
    return response.data
}

async function getMaxValue(){
    const response = await axios.get(serverAddress + "/reading/max")
    return response.data
}

async function getCurrentValue() {
    const response = await axios.get(serverAddress + "/reading")
    return response.data
}

app.get('/sensor/100', async (req, res) => {
    res.send(await getHundredValues());
    console.log("/sensor/100 accessed")
})

app.post('/display/brightness',(req, res) =>{
    setBrightness(req.body)
    console.log("post /display/brightness value: " + req.body)
    sendSuccess(res)
})

app.get('/display/brightness',(req, res) =>{
    res.send(String(display_brightness));
    console.log("get /display/brightness value: " + display_brightness)
})

app.post('/display/min',(req, res) =>{
    display_min = req.body
    console.log("/display/min accessed")
    sendSuccess(res)
})

app.post('/display/max', (req, res) => {
    display_max = req.body
    console.log("/display/max accessed")
    sendSuccess(res)
})

app.get('/sensor/max', async (req, res) => {
    const max_value = String(await getMaxValue())
    console.log("get /sensor/max value: " + max_value)
    res.send(max_value)
})

app.get('/sensor', async (req, res) =>{
    const current_value = String(await getCurrentValue())
    console.log("get /sensor value: " + current_value)
    res.send(current_value)
})

app.listen(port, '127.0.0.1', () => console.log(`Listening on port ${port}..`))


