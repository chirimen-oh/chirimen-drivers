// @ts-check
// AHT10,20 driver for CHIRIMEN raspberry pi3
// Temperature and Humidity I2C Sensor
// based on https://github.com/adafruit/Adafruit_CircuitPython_AHTx0/blob/main/adafruit_ahtx0.py
// Programmed by Satoru Takagi

/** @param {number} ms Delay for a number of milliseconds. */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

var AHTx0 = function (i2cPort, slaveAddress) {
	if (!slaveAddress) {
		slaveAddress = 0x38;
	}
	this.i2cPort = i2cPort;
	this.i2cSlave = null;
	this.slaveAddress = slaveAddress;
};

AHTx0.prototype = {
	init: async function () {
		this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
		await this.i2cSlave.writeBytes([0xba]); // softreset
		await sleep(30); // wait for measurement?
		try {
			await this.i2cSlave.writeBytes([0xe1, 0x08, 0x00]); // calibrate AHT10
		} catch (e) {
			// console.log("Try AHT20 calibrate");
			await this.i2cSlave.writeBytes([0xbe, 0x08, 0x00]); // calibrate AHT20
		}
		while (!((await this.i2cSlave.readByte()) & 0x08)) {}
	},
	readData: async function () {
		await this.i2cSlave.writeBytes([0xac, 0x33, 0x00]); // read
		while ((await this.i2cSlave.readByte()) & 0x80) {
			await sleep(10);
		}
		var mdata = await this.i2cSlave.readBytes(6); // prev data..
		var cTemp = ((mdata[3] & 0xf) << 16) | (mdata[4] << 8) | mdata[5];
		cTemp = (cTemp * 200.0) / 0x100000 - 50;
		var humidity = (mdata[1] << 12) | (mdata[2] << 4) | (mdata[3] >> 4);
		humidity = (humidity * 100) / 0x100000;

		return {
			humidity: humidity,
			temperature: cTemp,
		};
	},
};

export default AHTx0;
