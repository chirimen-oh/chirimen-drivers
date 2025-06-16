// @ts-check
// SDC4x driver for CHIRIMEN WebI2C
// For Sensirion SCD4X CO2 Sensor
// by Satoru Takagi
// Based on https://github.com/adafruit/Adafruit_CircuitPython_SCD4X
// and https://sensirion.com/media/documents/C4B87CE6/627C2DCD/CD_DS_SCD40_SCD41_Datasheet_D1.pdf
//
// history : 2022/10/24 基本部分が動くようになりました
//
// TODO: 細かな設定とか

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

var SCD40 = function (i2cPort, slaveAddress) {
	console.log("instance scd40");
	if (!slaveAddress) {
		slaveAddress = 0x62;
	}
	this.i2cPort = i2cPort;
	this.i2cSlave = null;
	this.slaveAddress = slaveAddress;

	// consts
	this._SCD4X_REINIT = 0x3646;
	this._SCD4X_FACTORYRESET = 0x3632;
	this._SCD4X_FORCEDRECAL = 0x362f;
	this._SCD4X_SELFTEST = 0x3639;
	this._SCD4X_DATAREADY = 0xe4b8;
	this._SCD4X_STOPPERIODICMEASUREMENT = 0x3f86;
	this._SCD4X_STARTPERIODICMEASUREMENT = 0x21b1;
	this._SCD4X_STARTLOWPOWERPERIODICMEASUREMENT = 0x21ac;
	this._SCD4X_READMEASUREMENT = 0xec05;
	this._SCD4X_SERIALNUMBER = 0x3682;
	this._SCD4X_GETTEMPOFFSET = 0x2318;
	this._SCD4X_SETTEMPOFFSET = 0x241d;
	this._SCD4X_GETALTITUDE = 0x2322;
	this._SCD4X_SETALTITUDE = 0x2427;
	this._SCD4X_SETPRESSURE = 0xe000;
	this._SCD4X_PERSISTSETTINGS = 0x3615;
	this._SCD4X_GETASCE = 0x2313;
	this._SCD4X_SETASCE = 0x2416;
};

SCD40.prototype = {
	init: async function () {
		this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
		await this.stop_periodic_measurement();
	},

	self_test: async function () {
		await this.stop_periodic_measurement();
		console.log("self_test wait 10sec");
		await this._send_command(this._SCD4X_SELFTEST, 10);
		var _buffer = await this._readBytes_and_check(3);
		if (_buffer == null || _buffer[0] != 0 || _buffer[1] != 0) {
			console.warn("Self test failed");
		} else {
			console.log("Self test succeed ^^");
		}
	},

	getData: async function () {
		var updated = false;
		if (await this.data_ready()) {
			await this._read_data();
			updated = true;
		}
		return {
			temperature: this._temperature,
			co2: this._co2,
			relative_humidity: this._relative_humidity,
			updated: updated,
		};
	},

	_read_data: async function () {
		await this._send_command(this._SCD4X_READMEASUREMENT, 0.001);
		await this._send_command(this._SCD4X_READMEASUREMENT);
		var _buffer = await this._readBytes_and_check(9);
		if (_buffer == null) {
			return;
		}
		this._co2 = (_buffer[0] << 8) | _buffer[1];
		var temp = (_buffer[3] << 8) | _buffer[4];
		this._temperature = -45 + 175 * (temp / 2 ** 16);
		var humi = (_buffer[6] << 8) | _buffer[7];
		this._relative_humidity = 100 * (humi / 2 ** 16);
	},

	data_ready: async function () {
		await this._send_command(this._SCD4X_DATAREADY, 0.001);
		var _buffer = await this._readBytes_and_check(3);
		if (_buffer == null) {
			return false;
		}
		return !((_buffer[0] & 0x07) == 0 && _buffer[1] == 0);
	},

	serial_number: async function () {
		await this._send_command(this._SCD4X_SERIALNUMBER, 1);
		var ans = await this.i2cSlave.readBytes(9);
		return [ans[0], ans[1], ans[3], ans[4], ans[6], ans[7]];
	},

	stop_periodic_measurement: async function () {
		await this._send_command(this._SCD4X_STOPPERIODICMEASUREMENT, 0.5);
	},

	start_periodic_measurement: async function () {
		await this._send_command(this._SCD4X_STARTPERIODICMEASUREMENT);
	},

	start_low_periodic_measurement: async function () {
		await this._send_command(this._SCD4X_STARTLOWPOWERPERIODICMEASUREMENT);
	},

	_send_command: async function (cmd, cmd_delay) {
		await this.i2cSlave.writeBytes([(cmd >> 8) & 0xff, cmd & 0xff]);
		if (cmd_delay) {
			await sleep(cmd_delay * 1000);
		}
	},

	_set_command_value: async function (cmd, value, cmd_delay) {
		var _buffer = new Array(5);
		_buffer[0] = (cmd >> 8) & 0xff;
		_buffer[1] = cmd & 0xff;
		_buffer[2] = (value >> 8) & 0xff;
		_buffer[3] = value & 0xff;

		_buffer[4] = this._crc8([_buffer[2], _buffer[3]]);

		await this.i2cSlave.writeBytes(_buffer);

		if (cmd_delay) {
			await sleep(cmd_delay * 1000);
		}
	},

	_readBytes_and_check: async function (length) {
		var ans = await this.i2cSlave.readBytes(length);
		var crcOk = true;
		for (var i = 0; i < length; i += 3) {
			if (this._crc8(ans.slice(i, i + 2)) != ans[i + 2]) {
				crcOk = false;
				break;
			}
		}
		if (crcOk) {
			return ans;
		} else {
			console.warn(" CRC ERROR");
			return null;
		}
	},
	_crc8: function (buffer) {
		// ダラス・マキシムCRC8というものらしい（CRC8_DALLAS_MAXIM ）
		// https://www.denshi.club/parts/2020/11/1sht31-2-crc.html
		var crc = 0xff;
		for (var byte of buffer) {
			crc ^= byte;
			for (var i = 0; i < 8; i++) {
				if (crc & 0x80) {
					crc = (crc << 1) ^ 0x31;
				} else {
					crc = crc << 1;
				}
			}
		}
		return crc & 0xff;
	},
};

export default SCD40;
