// CCS811 driver for CHIRIMEN
// TVOC and CO2 I2C Sensor
// based on https://github.com/gunyarakun/python-qwiic-CCS811-BME280/blob/master/CCS811.py
// datasheet https://cdn-learn.adafruit.com/assets/assets/000/044/636/original/CCS811_DS000459_2-00-1098798.pdf
// Programmed by Satoru Takagi

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

var CCS811 = function(i2cPort,slaveAddress){
	this.i2cPort = i2cPort;
	this.i2cSlave = null;
	this.slaveAddress = slaveAddress;;
	this.CS811_ADDRESS  =  0x5A;

	this.CCS811_STATUS = 0x00;
	this.CCS811_MEAS_MODE = 0x01;
	this.CCS811_ALG_RESULT_DATA = 0x02;
	this.CCS811_HW_ID = 0x20;

	this.CCS811_DRIVE_MODE_IDLE = 0x00;
	this.CCS811_DRIVE_MODE_1SEC = 0x01;
	this.CCS811_DRIVE_MODE_10SEC = 0x02;
	this.CCS811_DRIVE_MODE_60SEC = 0x03;
	this.CCS811_DRIVE_MODE_250MS = 0x04;

	this.CCS811_BOOTLOADER_APP_START = 0xF4;

	this.CCS811_HW_ID_CODE = 0x81;

	if (!this.slaveAddress){
		this.slaveAddress = this.CS811_ADDRESS;
	}
}


CCS811.prototype = {
	init: async function(mode){
		if ( ! mode ){
			mode = this.CCS811_DRIVE_MODE_1SEC = 0x01;
		}
		if ( mode !=this.CCS811_DRIVE_MODE_IDLE && mode!= this.CCS811_DRIVE_MODE_1SEC && mode!=this.CCS811_DRIVE_MODE_10SEC && mode!=this.CCS811_DRIVE_MODE_60SEC && mode!=this.CCS811_DRIVE_MODE_250MS){
			console.error("Invalid Mode Exit");
			return;
		}
//		console.log("init:",this.slaveAddress.toString(16));
		this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
		
		
		var hid = await this.i2cSlave.read8(this.CCS811_HW_ID);
//		console.log("hid:",hid.toString(16));
		if ( hid != this.CCS811_HW_ID_CODE ){
			console.error("Invalid Hardware : ", hid);
			return;
		}
		
		await this.i2cSlave.writeByte(this.CCS811_BOOTLOADER_APP_START);
		await sleep(100);
		if ( ! await this.checkError() ){
			return;
		}
		var  INT_DATARDY = 1; // no interrupt
		mode = ((mode << 4) | ( INT_DATARDY << 3));
//		console.log("set MEAS_MODE Reg:",mode.toString(2));
		
		await this.i2cSlave.write8(this.CCS811_MEAS_MODE, mode);
//		await sleep(2000);
	},
	
	checkError: async function(){
		var err = await this.i2cSlave.read8(this.CCS811_STATUS);
//		console.log("ERR:",err.toString(2));
		if ( err & 0b00000001 == 1 ){
			console.error("ERROR OCCURED!!");
			var err2 = await this.i2cSlave.read8(0xE0)
			console.log("ERR2:",err.toString(2));
			return ( false );
		} else {
			if ( (err & 0b10000000) > 0 && (err & 0b00010000) > 0){
				console.log("OK! : Valid application firmware loaded and Firmware is in application mode.");
				return ( true );
			} else {
				console.error("Firmware is not....");
				return ( false );
			}
		}
	},
	
	readData: async function(){
		var av = await this.i2cSlave.read8(this.CCS811_STATUS);
		if ( (av & 0b1000) == 0 ){
			console.error("No new data samples are ready");
			return ( {CO2:null,TVOC:null,status:null,error:1} );
		}
		await this.i2cSlave.writeByte(this.CCS811_ALG_RESULT_DATA);
		var dat = await this.i2cSlave.readBytes(8);
		var co2  = dat[0] << 8 | dat[1];
		var tvoc = dat[2] << 8 | dat[3];
		var stat = dat[4];
		var err = dat[5];
//		console.log("dat:",dat," co2:",co2," tvoc:",tvoc);
		return {CO2:co2,TVOC:tvoc,status:stat,error:err};
	},
};

export default CCS811;
