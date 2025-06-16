// LTR390 driver for WebI2C
// https://www.waveshare.com/wiki/Environment_Sensor_HAT
// の
// https://files.waveshare.com/upload/b/bc/Environment_Sensor_HAT_Code.7z
// をベースに移植
// 2023/12/13 Ported by Satoru Takagi

var LTR390 = function (i2cPort, slaveAddress) {
	if (!slaveAddress) {
		slaveAddress = 0x53;
	}
	this.i2cPort = i2cPort;
	this.i2cSlave = null;
	this.slaveAddress = slaveAddress;

	// consts
	this.LTR390_MAIN_CTRL = 0x00; // Main control register
	this.LTR390_MEAS_RATE = 0x04; // Resolution and data rate
	this.LTR390_GAIN = 0x05; // ALS and UVS gain range
	this.LTR390_PART_ID = 0x06; // Part id/revision register
	this.LTR390_MAIN_STATUS = 0x07; // Main status register
	this.LTR390_ALSDATA = 0x0d; // ALS data lowest byte, 3 byte
	this.LTR390_UVSDATA = 0x10; // UVS data lowest byte, 3 byte
	this.LTR390_INT_CFG = 0x19; // Interrupt configuration
	this.LTR390_INT_PST = 0x1a; // Interrupt persistance config
	this.LTR390_THRESH_UP = 0x21; // Upper threshold, low byte, 3 byte
	this.LTR390_THRESH_LOW = 0x24; // Lower threshold, low byte, 3 byte

	//ALS/UVS measurement resolution, Gain setting, measurement rate
	this.RESOLUTION_20BIT_TIME400MS = 0x00;
	this.RESOLUTION_19BIT_TIME200MS = 0x10;
	this.RESOLUTION_18BIT_TIME100MS = 0x20; //default
	this.RESOLUTION_17BIT_TIME50MS = 0x3;
	this.RESOLUTION_16BIT_TIME25MS = 0x40;
	this.RESOLUTION_13BIT_TIME12_5MS = 0x50;
	this.RATE_25MS = 0x0;
	this.RATE_50MS = 0x1;
	this.RATE_100MS = 0x2; // default
	this.RATE_200MS = 0x3;
	this.RATE_500MS = 0x4;
	this.RATE_1000MS = 0x5;
	this.RATE_2000MS = 0x6;

	// measurement Gain Range.
	this.GAIN_1 = 0x0;
	this.GAIN_3 = 0x1; // default
	this.GAIN_6 = 0x2;
	this.GAIN_9 = 0x3;
	this.GAIN_18 = 0x4;
};

LTR390.prototype = {
	sleep: function (ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	},
	init: async function () {
		this.i2cSlave = await this.i2cPort.open(this.slaveAddress);

		this.sensID = await this.Read_Byte(this.LTR390_PART_ID);
		// console.log("ID =" ,this.sensID)
		if (this.sensID != 0xb2) {
			console.error("read ID error!,Check the hardware... ID:", this.sensID);
			return;
		}
		await this.Write_Byte(this.LTR390_MAIN_CTRL, 0x0a); //  UVS in Active Mode
		await this.Write_Byte(
			this.LTR390_MEAS_RATE,
			this.RESOLUTION_20BIT_TIME400MS | this.RATE_2000MS
		); //  Resolution=18bits, Meas Rate = 100ms
		await this.Write_Byte(this.LTR390_GAIN, this.GAIN_3); //  Gain Range=3.
		// await this.Write_Byte(this.LTR390_INT_CFG, 0x34) // UVS_INT_EN=1, Command=0x34
		// await this.Write_Byte(this.LTR390_GAIN, GAIN_3) //  Resolution=18bits, Meas Rate = 100ms
	},

	Read_Byte: async function (cmd) {
		return await this.i2cSlave.read8(cmd);
	},

	Write_Byte: async function (cmd, val) {
		await this.i2cSlave.write8(cmd, val);
	},

	UVS: async function (self) {
		// this.Write_Byte(LTR390_MAIN_CTRL, 0x0A) //  UVS in Active Mode
		var Data1 = await this.Read_Byte(this.LTR390_UVSDATA);
		var Data2 = await this.Read_Byte(this.LTR390_UVSDATA + 1);
		var Data3 = await this.Read_Byte(this.LTR390_UVSDATA + 2);
		var uv = (Data3 << 16) | (Data2 << 8) | Data1;
		// var UVS = Data3*65536+Data2*256+Data1
		// console.log("UVS = ", UVS)
		return uv;
	},
};

export default LTR390;
