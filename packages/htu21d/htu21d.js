// @ts-check
// HTU21D driver for CHIRIMEN raspberry pi3
// Temperature and Humidity I2C Sensor
// based on https://github.com/adafruit/Adafruit_CircuitPython_HTU21D/blob/main/adafruit_htu21d.py
// Programmed by Satoru Takagi

/** @param {number} ms Delay for a number of milliseconds. */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

var HTU21D = function(i2cPort,slaveAddress){
	if (!slaveAddress){
		slaveAddress = 0x40;
	}
	this.i2cPort = i2cPort;
	this.i2cSlave = null;
	this.slaveAddress = slaveAddress;
	
	this.READ_TEMP_HOLD = 0xE3;
	this.READ_HUM_HOLD = 0xE5;
	this.READ_TEMP_NOHOLD = 0xF3;
	this.READ_HUM_NOHOLD = 0xF5;
	this.WRITE_USER_REG = 0xE6;
	this.READ_USER_REG = 0xE7;
	this.SOFT_RESET = 0xFE;
}

HTU21D.prototype = {
	init: async function(){
		this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
		await this.i2cSlave.writeBytes([ this.SOFT_RESET]); // softreset
		await sleep(10); // wait for measurement?
	},
	readTemperature: async function(){
		await this.i2cSlave.writeBytes([ this.READ_TEMP_NOHOLD]); // read
		await sleep(50); // wait for measurement?
		var mdata = await this.i2cSlave.readBytes(3);
		var bTemp = ( (mdata[0] << 8) | mdata[1]);
		var cTemp = bTemp * 175.72 / 65536.0 - 46.85;
		if(mdata[2]==this._crc([mdata[0],mdata[1]])){
			return ( cTemp );
		} else {
			return ( null );
		}
	},
	readHumidity: async function(){
		await this.i2cSlave.writeBytes([ this.READ_HUM_NOHOLD]); // read
		await sleep(50); // wait for measurement?
		var mdata = await this.i2cSlave.readBytes(3);
		var bHum = ( (mdata[0] << 8) | mdata[1]);
		var humidity = bHum  * 125.0 / 65536.0 - 6.0;
		if(mdata[2]==this._crc([mdata[0],mdata[1]])){
			return ( humidity );
		} else {
			return ( null );
		}
	},
	_crc: function(buffer){
		var crc = 0;
		for( var byte of buffer){
			crc ^= byte;
			for(var i = 0 ; i < 8 ; i++){
				if (crc & 0x80){
					crc = (crc << 1) ^ 0x131;
				} else {
					crc = crc << 1
				}
			}
		}
		return crc ;
	}
};

export default HTU21D;
