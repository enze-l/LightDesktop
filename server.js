const shell = require('shelljs')
const asciichart = require('asciichart')
const axios = require('axios')

const serverAddress = "http://192.168.2.64:50000"
const displayBrightness = 1

function getHundredValues(){
    return axios.get(serverAddress + "/list/100")
}

function getMinValue(){
    return axios.get(serverAddress + "/reading/min")
}

function getMaxValue(){
    return axios.get(serverAddress + "/reading/max")
}

function getCurrentValue(){
    return axios.get(serverAddress + "/reading")
}

Promise.all([getHundredValues(), getMinValue(), getMaxValue(), getCurrentValue()])
    .then(function(results) {
        const hundredValues = results[0].data
        const minValue = results[1].data
        const maxValue = results[2].data
        const currentValue = results[3].data

        const readingLine = String(hundredValues).split(/(\s+)/).filter( e => e.trim().length > 0)
        const baseLine = new Array(readingLine.length).fill(String(minValue))
        const topLine = new Array(readingLine.length).fill(String(maxValue))
        const currentLine = new Array(readingLine.length).fill(String(currentValue))

        const config = {
            colors: [ asciichart.blue, asciichart.default, asciichart.yellow, asciichart.green ],
            height: 20
        }

        const displayInfoArray = String(shell.exec("xrandr --prop")).split(/(\s+)/).filter( e => e.trim().length > 0)
        const displayName = displayInfoArray[displayInfoArray.indexOf("connected") - 1]
        shell.exec("xrandr --output " + displayName + " --brightness " + displayBrightness)

        console.log(asciichart.plot([baseLine, readingLine, topLine, currentLine], config))
    })