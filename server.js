const shell = require('shelljs')
const asciichart = require('asciichart')
const axios = require('axios')

const serverAdress = "http://192.168.2.64:50000"

shell.exec("echo 'test'")

function getHundretValues(){
    return axios.get(serverAdress + "/list/100")
}

function getMinValue(){
    return axios.get(serverAdress + "/reading/min")
}

function getMaxValue(){
    return axios.get(serverAdress + "/reading/max")
}

Promise.all([getHundretValues(), getMinValue(), getMaxValue()])
    .then(function(results) {
        const hundretValues = results[0].data
        const minValue = results[1].data
        const maxValue = results[2].data

        const hundretArray = String(hundretValues).split(/(\s+)/).filter( e => e.trim().length > 0)
        const baseLine = new Array(hundretArray.length).fill(String(minValue))
        const topLine = new Array(hundretArray.length).fill(String(maxValue))
        console.log(asciichart.plot([baseLine, hundretArray, topLine], {height: 10}))
    })