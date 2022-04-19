const shell = require('shelljs')
const asciichart = require('asciichart')
const axios = require('axios')

const serverAdress = "http://192.168.2.64:50000"

function getHundretValues(){
    return axios.get(serverAdress + "/list/day")
}

function getMinValue(){
    return axios.get(serverAdress + "/reading/min")
}

function getMaxValue(){
    return axios.get(serverAdress + "/reading/max")
}

function getCurrentValue(){
    return axios.get(serverAdress + "/reading")
}

Promise.all([getHundretValues(), getMinValue(), getMaxValue(), getCurrentValue()])
    .then(function(results) {
        const hundretValues = results[0].data
        const minValue = results[1].data
        const maxValue = results[2].data
        const currentValue = results[3].data

        const readingLine = String(hundretValues).split(/(\s+)/).filter( e => e.trim().length > 0)
        const baseLine = new Array(readingLine.length).fill(String(minValue))
        const topLine = new Array(readingLine.length).fill(String(maxValue))
        const currentLine = new Array(readingLine.length).fill(String(currentValue))

        config = {
            colors: [ asciichart.blue, asciichart.default, asciichart.yellow, asciichart.green ],
            height: 20
        }

        shell.exec("xrandr --output DP-0 --brightness 1")

        console.log(asciichart.plot([baseLine, readingLine, topLine, currentLine], config))
    })