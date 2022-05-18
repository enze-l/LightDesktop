import axios from "axios";

export default class Sensor {
    constructor(serverAddress) {
        this.serverAddress = serverAddress
    }

    getHundredValues() {
        return axios.get(this.serverAddress + "/sensor/100")
    }

    getDayValues() {
        return axios.get(this.serverAddress + "/sensor/day")
    }

    getCurrentBrightness() {
        return axios.get(this.serverAddress + "/sensor")
    }

    getMaxBrightness() {
        return axios.get(this.serverAddress + "/sensor/max")
    }
}
