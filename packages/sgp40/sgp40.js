// SGP40 driver for WebI2C
// https://www.waveshare.com/wiki/Environment_Sensor_HAT
// の
// https://files.waveshare.com/upload/b/bc/Environment_Sensor_HAT_Code.7z
// をベースに移植
// 2023/12/13 Ported by Satoru Takagi

var SGP40 = function (i2cPort, slaveAddress) {
	if (!slaveAddress) {
		slaveAddress = 0x59;
	}
	this.i2cPort = i2cPort;
	this.i2cSlave = null;
	this.slaveAddress = slaveAddress;
	this.ch0 = null;
	this.ch1 = null;

	// CONSTS
	this.SGP40_CMD_FEATURE_SET = [0x20, 0x2f];
	this.SGP40_CMD_MEASURE_TEST = [0x28, 0x0e];
	this.SGP40_CMD_SOFT_RESET = [0x00, 0x06];
	this.SGP40_CMD_HEATER_OFF = [0x36, 0x15];
	this.SGP40_CMD_MEASURE_RAW = [0x26, 0x0f];
	this.CRC_TABLE = [
		0, 49, 98, 83, 196, 245, 166, 151, 185, 136, 219, 234, 125, 76, 31, 46, 67,
		114, 33, 16, 135, 182, 229, 212, 250, 203, 152, 169, 62, 15, 92, 109, 134,
		183, 228, 213, 66, 115, 32, 17, 63, 14, 93, 108, 251, 202, 153, 168, 197,
		244, 167, 150, 1, 48, 99, 82, 124, 77, 30, 47, 184, 137, 218, 235, 61, 12,
		95, 110, 249, 200, 155, 170, 132, 181, 230, 215, 64, 113, 34, 19, 126, 79,
		28, 45, 186, 139, 216, 233, 199, 246, 165, 148, 3, 50, 97, 80, 187, 138,
		217, 232, 127, 78, 29, 44, 2, 51, 96, 81, 198, 247, 164, 149, 248, 201, 154,
		171, 60, 13, 94, 111, 65, 112, 35, 18, 133, 180, 231, 214, 122, 75, 24, 41,
		190, 143, 220, 237, 195, 242, 161, 144, 7, 54, 101, 84, 57, 8, 91, 106, 253,
		204, 159, 174, 128, 177, 226, 211, 68, 117, 38, 23, 252, 205, 158, 175, 56,
		9, 90, 107, 69, 116, 39, 22, 129, 176, 227, 210, 191, 142, 221, 236, 123,
		74, 25, 40, 6, 55, 100, 85, 194, 243, 160, 145, 71, 118, 37, 20, 131, 178,
		225, 208, 254, 207, 156, 173, 58, 11, 88, 105, 4, 53, 102, 87, 192, 241,
		162, 147, 189, 140, 223, 238, 121, 72, 27, 42, 193, 240, 163, 146, 5, 52,
		103, 86, 120, 73, 26, 43, 188, 141, 222, 239, 130, 179, 224, 209, 70, 119,
		36, 21, 59, 10, 89, 104, 255, 206, 157, 172,
	];
	this.WITHOUT_HUM_COMP = [0x26, 0x0f, 0x80, 0x00, 0xa2, 0x66, 0x66, 0x93]; // default Temperature=25 Humidity=50
	this.WITH_HUM_COMP = [0x26, 0x0f, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]; //Manual input
};

SGP40.prototype = {
	sleep: function (ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	},
	init: async function () {
		this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
		// feature set 0x3220
		await this.write(this.SGP40_CMD_FEATURE_SET);
		await this.sleep(250);
		var Rbuf = await this.Read();
//		console.log("feature set:", (Math.floor(Rbuf[0]) << 8) | Rbuf[1]);
		if (((Math.floor(Rbuf[0]) << 8) | Rbuf[1]) != 0x3220) {
			console.error("Self test failed");
			return;
		}

		// Self Test 0xD400
		await this.write(this.SGP40_CMD_MEASURE_TEST);
		await this.sleep(250);
		var Rbuf = await this.Read();
//		console.log("Self Test  :", (Math.floor(Rbuf[0]) << 8) | Rbuf[1]);
		if (((Math.floor(Rbuf[0]) << 8) | Rbuf[1]) != 0xd400) {
			//0x4B00 is failed,0xD400 pass
			console.error("Self test failed");
			return;
		}
	},

	Read: async function () {
		await this.i2cSlave.writeByte(this.slaveAddress);
		var ans = await this.i2cSlave.readBytes(3);
		return ans;
	},

	write: async function (cmd) {
//		await this.i2cSlave.write16(cmd);
		await this.i2cSlave.writeBytes(cmd);
	},

	write_block: async function (cmd) {
//		console.log("write_block:", cmd);
		await this.i2cSlave.writeBytes(cmd);
	},

	raw: async function () {
//		console.log("raw");
		await this.write_block(this.WITHOUT_HUM_COMP);
		await this.sleep(250);
		var Rbuf = await this.Read();
//		console.log("raw:",Rbuf);
		return (Math.floor(Rbuf[0]) << 8) | Rbuf[1];
	},

	measureRaw: async function (temperature, humidity) {
//		console.log("measureRaw");
		var h = (humidity * 0xffff) / 100;
		var paramh_h = (h >> 8);
		var paramh_l = (h & 0xff);
		var crch = this.__crc(paramh_h, paramh_l);

		var t = ((temperature + 45) * 0xffff) / 175;
		var paramt_h = (t >> 8);
		var paramt_l = (t & 0xff);
		var crct = this.__crc(paramt_h, paramt_l);

		this.WITH_HUM_COMP[2] = paramh_h;
		this.WITH_HUM_COMP[3] = paramh_l;
		this.WITH_HUM_COMP[4] = Math.floor(crch);
		this.WITH_HUM_COMP[5] = paramt_h;
		this.WITH_HUM_COMP[6] = paramt_l;
		this.WITH_HUM_COMP[7] = Math.floor(crct);
		//console.log("WITH_HUM_COMP:", this.WITH_HUM_COMP);
		await this.write_block(this.WITH_HUM_COMP);

		await this.sleep(500);
		var Rbuf = await this.Read();
//		console.log(Rbuf);
		return (Math.floor(Rbuf[0]) << 8) | Rbuf[1];
	},

	__crc: function (msb, lsb) {
		var crc = 0xff;
		crc ^= msb;
		crc = this.CRC_TABLE[crc];
		if (lsb) {
			crc ^= lsb;
			crc = this.CRC_TABLE[crc];
		}
		return crc;
	},
};

export default SGP40;
