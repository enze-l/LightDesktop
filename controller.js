const express = require('express')
const shell = require("shelljs");
const bodyParser = require('body-parser')
const app = express()
app.use(bodyParser.text({type:"*/*"}))

const port = process.env.PORT || 8081
let sensor_min = 100
let sensor_max = 500
let display_min = .5
let display_max = 1

function setBrightness(brightness){
    const displayInfoArray = String(
        shell.exec("xrandr --prop", { silent: true })).split(/(\s+)/).filter( e => e.trim().length > 0
    )
    const displayName = displayInfoArray[displayInfoArray.indexOf("connected") - 1]
    shell.exec("xrandr --output " + displayName + " --brightness " + brightness)
}

function sendSuccess(res){
    res.sendStatus(204)
}

app.post('/display/brightness',(req, res) =>{
    setBrightness(req.body)
    sendSuccess(res)
})

app.post('/display/min',(req, res) =>{
    display_min = req.body
    sendSuccess(res)
})

app.post('/display/max', (req, res) => {
    display_max = req.body
    sendSuccess(res)
})

app.post('/sensor/min', (req, res) => {
    sensor_min = req.body
    sendSuccess(res)
})

app.post('/sensor/max', (req, res) => {
    sensor_max = req.body
})

app.listen(port, () => console.log(`Listening on port ${port}..`))


