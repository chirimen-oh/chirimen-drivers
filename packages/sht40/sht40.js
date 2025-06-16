// @ts-check
// SHT40 driver for CHIRIMEN
// Temperature and Humidity I2C Sensor
// Programmed by Satoru Takagi

/** @param {number} ms Delay for a number of milliseconds. */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

var SHT40 = function (i2cPort, slaveAddress) {
    if (!slaveAddress) {
        slaveAddress = 0x44;
    }
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;
}

SHT40.prototype = {
    init: async function () {
        this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
    },
    readData: async function () {
        await this.i2cSlave.writeByte(0xFD); // High repeatability measurement
        await sleep(10); // wait for measurement?
        var mdata = await this.i2cSlave.readBytes(6); // prev data..
        // cTemp MSB, cTemp LSB, cTemp CRC, Humididty MSB, Humidity LSB, Humidity CRC
        var cTemp = (175 * (mdata[0] * 256 + mdata[1]) / 65535.0) - 45; // celsius
        var humidity = (125 * (mdata[3] * 256 + mdata[4]) / 65535.0) - 6;
        return {
            humidity: humidity,
            temperature: cTemp
        }

    }
};

export default SHT40;
