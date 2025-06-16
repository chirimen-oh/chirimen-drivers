// BME680 driver for CHIRIMEN WebI2C
// ported from https://github.com/adafruit/Adafruit_CircuitPython_BME680/blob/master/adafruit_bme680.py
// Programmed by Satoru Takagi

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

var BME680 = function(i2cPort,slaveAddress){
	this._BME680_CHIPID = (0x61);

	this._BME680_REG_CHIPID = (0xD0);
	this._BME680_BME680_COEFF_ADDR1 = (0x89);
	this._BME680_BME680_COEFF_ADDR2 = (0xE1);
	this._BME680_BME680_RES_HEAT_0 = (0x5A);
	this._BME680_BME680_GAS_WAIT_0 = (0x64);

	this._BME680_REG_SOFTRESET = (0xE0);
	this._BME680_REG_CTRL_GAS = (0x71);
	this._BME680_REG_CTRL_HUM = (0x72);
	this._BME680_REG_STATUS = (0x73);
	this._BME680_REG_CTRL_MEAS = (0x74);
	this._BME680_REG_CONFIG = (0x75);

	this._BME680_REG_MEAS_STATUS = (0x1D);
	this._BME680_REG_PDATA = (0x1F);
	this._BME680_REG_TDATA = (0x22);
	this._BME680_REG_HDATA = (0x25);

	this._BME680_SAMPLERATES = [0, 1, 2, 4, 8, 16];
	this._BME680_FILTERSIZES = [0, 1, 3, 7, 15, 31, 63, 127];

	this._BME680_RUNGAS = (0x10);

	this._LOOKUP_TABLE_1 = [
		2147483647.0,
		2147483647.0,
		2147483647.0,
		2147483647.0,
		2147483647.0,
		2126008810.0,
		2147483647.0,
		2130303777.0,
		2147483647.0,
		2147483647.0,
		2143188679.0,
		2136746228.0,
		2147483647.0,
		2126008810.0,
		2147483647.0,
		2147483647.0,
	];

	this._LOOKUP_TABLE_2 = [
		4096000000.0,
		2048000000.0,
		1024000000.0,
		512000000.0,
		255744255.0,
		127110228.0,
		64000000.0,
		32258064.0,
		16016016.0,
		8000000.0,
		4000000.0,
		2000000.0,
		1000000.0,
		500000.0,
		250000.0,
		125000.0,
	];

	
	
	this.digT = [];
	this.digP = [];
	this.digH = [];
	this.t_fine = 0;
	this.i2cPort = i2cPort;
	this.i2cSlave = null;
	if (slaveAddress){
		this.slaveAddress = slaveAddress;
	} else {
		this.slaveAddress = 0x77;
	}
};

BME680.prototype = {
	init: async function(){
		this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
		console.log("init ok:"+this.i2cSlave);
		await this.setup();
	},
	readData: async function(){
		await this._perform_reading();
		var temperature = this.temperature();
		var pressure = this.pressure();
		var humidity = this.humidity();
		var gas = this.gas();
		// console.log("temperature:",temperature," pressure:",pressure," humidity:",humidity," gas:",gas);
		return {
			temperature:temperature,
			pressure:pressure,
			humidity:humidity,
			gas:gas
		}
	},
	setup: async function(){
		// Check the BME680 was found, read the coefficients and enable the sensor for continuous reads.
		await this.i2cSlave.write8(this._BME680_REG_SOFTRESET, 0xB6);
		await sleep(5);

		// Check device ID.
		var chip_id = await this.i2cSlave.read8(this._BME680_REG_CHIPID);
		console.log("chip_id:",chip_id);
		if (chip_id != this._BME680_CHIPID){
			console.error("Failed to find BME680! Chip ID : ", chip_id.toString(16));
			return(false);
		}

		await this._read_calibration();

		// set up heater
		await this.i2cSlave.write8(this._BME680_BME680_RES_HEAT_0, 0x73);
		await this.i2cSlave.write8(this._BME680_BME680_GAS_WAIT_0, 0x65);

		this.sea_level_pressure = 1013.25;
		// "Pressure in hectoPascals at sea level. Used to calibrate ``altitude``.

		// Default oversampling and filter register values.
		this._pressure_oversample = 0b011;
		this._temp_oversample = 0b100;
		this._humidity_oversample = 0b010;
		this._filter = 0b010;

		this._adc_pres = null;
		this._adc_temp = null;
		this._adc_hum = null;
		this._adc_gas = null;
		this._gas_range = null;
		this._t_fine = null;

		this._last_reading = 0;
		this._min_refresh_time = 1 / this.refresh_rate;
	},
	
	_read_calibration: async function(){
		// Read & save the calibration coefficients"""
		await this.i2cSlave.writeByte(this._BME680_BME680_COEFF_ADDR1);
		var coeff1 =  await this.i2cSlave.readBytes(25)
		
		await this.i2cSlave.writeByte(this._BME680_BME680_COEFF_ADDR2);
		var coeff2 =  await this.i2cSlave.readBytes(16)
		
		var coeff = coeff1.concat(coeff2);
		// console.log("coeff1:",coeff1," coeff2:",coeff2, " coeff:",coeff);

		// coeff = list(struct.unpack("<hbBHhbBhhbbHhhBBBHbbbBbHhbb", bytes(coeff[1:39])))
		// coeff = [float(i) for i in coeff]
		
		// see https://docs.python.org/ja/3/library/struct.html
		
		// translated register numb
		// 000000111111122222223333333 // byte offset10
		// 134579013567913456890123578 // byte offset1
		// hbBHhbBhhbbHhhBBBHbbbBbHhbb // little endian, UC:unsigned, lc:signed, b:char(1), h:short(2)
		// 000000000011111111112222222 // coeff array index10
		// 012345678901234567890123456 // coeff array index1
		
		//this._temp_calibration = [coeff[x] for x in [23, 0, 1]]
		this._temp_calibration = [];
		this._temp_calibration.push( ((coeff[34] << 8) | coeff[33]) );				// 23
		this._temp_calibration.push( this.getSVal2((coeff[2] << 8) | coeff[1]) );	// 0
		this._temp_calibration.push( this.getSVal1( coeff[3]) );					// 1
		
		//this._pressure_calibration = [coeff[x] for x in [3, 4, 5, 7, 8, 10, 9, 12, 13, 14]]
		this._pressure_calibration = [];
		this._pressure_calibration.push( ((coeff[6] << 8) | coeff[5]) );				// 3
		this._pressure_calibration.push( this.getSVal2((coeff[8] << 8) | coeff[7]) );	// 4
		this._pressure_calibration.push( this.getSVal1( coeff[9]) );					// 5
		this._pressure_calibration.push( this.getSVal2((coeff[12] << 8) | coeff[11]) );	// 7
		this._pressure_calibration.push( this.getSVal2((coeff[14] << 8) | coeff[13]) );	// 8
		this._pressure_calibration.push( this.getSVal1( coeff[16]) );					// 10
		this._pressure_calibration.push( this.getSVal1( coeff[15]) );					// 9
		this._pressure_calibration.push( this.getSVal2((coeff[20] << 8) | coeff[19]) );	// 12
		this._pressure_calibration.push( this.getSVal2((coeff[22] << 8) | coeff[21]) );	// 13
		this._pressure_calibration.push( ( coeff[23]) );								// 14
		
		//this._humidity_calibration = [coeff[x] for x in [17, 16, 18, 19, 20, 21, 22]]
		this._humidity_calibration = [];
		this._humidity_calibration.push( ((coeff[27] << 8) | coeff[26]) );		// 17
		this._humidity_calibration.push( ( coeff[25]) );						// 16
		this._humidity_calibration.push( this.getSVal1( coeff[28]) );			// 18
		this._humidity_calibration.push( this.getSVal1( coeff[29]) );			// 19
		this._humidity_calibration.push( this.getSVal1( coeff[30]) );			// 20
		this._humidity_calibration.push( ( coeff[31]) );						// 21
		this._humidity_calibration.push( this.getSVal1( coeff[32]) );			// 22
		
		
		//this._gas_calibration = [coeff[x] for x in [25, 24, 26]]
		this._gas_calibration = [];
		this._gas_calibration.push( this.getSVal1( coeff[37]) );					// 25
		this._gas_calibration.push( this.getSVal2((coeff[36] << 8) | coeff[35]) );	// 24
		this._gas_calibration.push( this.getSVal1( coeff[38]) );					// 26
		
		// flip around H1 & H2
		this._humidity_calibration[1] *= 16;
		this._humidity_calibration[1] += this._humidity_calibration[0] % 16;
		this._humidity_calibration[0] /= 16;
		
		/**
		console.log("_temp_calibration    : ",this._temp_calibration);
		console.log("_pressure_calibration: ",this._pressure_calibration);
		console.log("_humidity_calibration: ",this._humidity_calibration);
		console.log("_gas_calibration     : ",this._gas_calibration);
		**/
		
		this._heat_range = (await this.i2cSlave.read8(0x02) & 0x30) / 16;
		this._heat_val = await this.i2cSlave.read8(0x00);
		this._sw_err = (await this.i2cSlave.read8(0x04) & 0xF0) / 16;
		
		// console.log("this._heat_range:",this._heat_range," this._heat_val:",this._heat_val," this._sw_err:",this._sw_err);
		
	},
	
	_perform_reading: async function(){
		// Perform a single-shot reading from the sensor and fill internal data structure for calculations
		if (new Date().getTime() - this._last_reading < this._min_refresh_time){
			return
		}

		// set filter
		await this.i2cSlave.write8(this._BME680_REG_CONFIG, this._filter << 2);
		
		// turn on temp oversample & pressure oversample
		await this.i2cSlave.write8(this._BME680_REG_CTRL_MEAS, (this._temp_oversample << 5) | (this._pressure_oversample << 2));
		
		// turn on humidity oversample
		await this.i2cSlave.write8(this._BME680_REG_CTRL_HUM, this._humidity_oversample);
		
		// gas measurements enabled
		await this.i2cSlave.write8(this._BME680_REG_CTRL_GAS, this._BME680_RUNGAS);

		var ctrl = await this.i2cSlave.read8(this._BME680_REG_CTRL_MEAS);
		ctrl = (ctrl & 0xFC) | 0x01  // enable single shot!
		await this.i2cSlave.write8(this._BME680_REG_CTRL_MEAS, ctrl);
		var new_data = false;
		var data;
		while (!new_data){
			await this.i2cSlave.writeByte(this._BME680_REG_MEAS_STATUS);
			data = await this.i2cSlave.readBytes(15);
			new_data = (data[0] & 0x80) != 0;
			// console.log("data:",data);
			sleep(5);
		}
		this._last_reading = new Date().getTime();

		this._adc_pres = this._read24(data[2],data[3],data[4]) / 16;
		this._adc_temp = this._read24(data[5],data[6],data[7]) / 16;
		this._adc_hum = ((data[8] << 8) | data[9]); // struct.unpack(">H", bytes(data[8:10]))[0]
		this._adc_gas = Math.floor(((data[13] << 8) | data[14]) / 64); // int(struct.unpack(">H", bytes(data[13:15]))[0] / 64)
		this._gas_range = data[14] & 0x0F

		var var1 = (this._adc_temp / 8) - (this._temp_calibration[0] * 2);
		var var2 = (var1 * this._temp_calibration[1]) / 2048;
		var var3 = ((var1 / 2) * (var1 / 2)) / 4096;
		var3 = (var3 * this._temp_calibration[2] * 16) / 16384;
		this._t_fine = Math.floor(var2 + var3);
		
		// console.log("GAS:   byte:",data[13],data[14],"  adc:",this._adc_gas);
		// console.log("this._adc_pres:",this._adc_pres,"\nthis._adc_temp:",this._adc_temp,"\nthis._adc_hum:",this._adc_hum,"\nthis._adc_gas:",this._adc_gas,"\nthis._gas_range:",this._gas_range,"\nthis._t_fine:",this._t_fine);
		
		
	},
	
	temperature: function(){
		// The compensated temperature in degrees celsius."""
		var calc_temp = ((this._t_fine * 5) + 128) / 256;
		return calc_temp / 100;
	},
	pressure: function(){
		// The barometric pressure in hectoPascals
		var var1 = (this._t_fine / 2) - 64000;
		var var2 = ((var1 / 4) * (var1 / 4)) / 2048;
		var2 = (var2 * this._pressure_calibration[5]) / 4;
		var2 = var2 + (var1 * this._pressure_calibration[4] * 2);
		var2 = (var2 / 4) + (this._pressure_calibration[3] * 65536);
		var1 = ((((var1 / 4) * (var1 / 4)) / 8192) * (this._pressure_calibration[2] * 32) / 8 ) + ((this._pressure_calibration[1] * var1) / 2);
		var1 = var1 / 262144;
		var1 = ((32768 + var1) * this._pressure_calibration[0]) / 32768;
		var calc_pres = 1048576 - this._adc_pres;
		calc_pres = (calc_pres - (var2 / 4096)) * 3125;
		calc_pres = (calc_pres / var1) * 2;
		var1 = ( this._pressure_calibration[8] * (((calc_pres / 8) * (calc_pres / 8)) / 8192) ) / 4096;
		var2 = ((calc_pres / 4) * this._pressure_calibration[7]) / 8192;
		var var3 = (((calc_pres / 256) ** 3) * this._pressure_calibration[9]) / 131072;
		calc_pres += (var1 + var2 + var3 + (this._pressure_calibration[6] * 128)) / 16;
		return calc_pres / 100;
	},
	humidity: function(){
		// The relative humidity in RH %
		var temp_scaled = ((this._t_fine * 5) + 128) / 256
		var var1 = (this._adc_hum - (this._humidity_calibration[0] * 16)) - (
			(temp_scaled * this._humidity_calibration[2]) / 200);
		var var2 = ( this._humidity_calibration[1] * (((temp_scaled * this._humidity_calibration[3]) / 100) + (((
			temp_scaled * ((temp_scaled * this._humidity_calibration[4]) / 100)) / 64 ) / 100 ) + 16384 ) ) / 1024;
		var var3 = var1 * var2;
		var var4 = this._humidity_calibration[5] * 128;
		var4 = (var4 + ((temp_scaled * this._humidity_calibration[6]) / 100)) / 16;
		var var5 = ((var3 / 16384) * (var3 / 16384)) / 1024;
		var var6 = (var4 * var5) / 2;
		var calc_hum = (((var3 + var6) / 1024) * 1000) / 4096;
		calc_hum /= 1000;  // get back to RH
		
		if (calc_hum > 100){
			calc_hum = 100
		}
		if (calc_hum < 0){
			calc_hum = 0
		}
		return calc_hum;
	},
	gas: function(){
		// The gas resistance in ohms
		var var1 = ( (1340 + (5 * this._sw_err)) * (this._LOOKUP_TABLE_1[this._gas_range])) / 65536;
		var var2 = ((this._adc_gas * 32768) - 16777216) + var1;
		var var3 = (this._LOOKUP_TABLE_2[this._gas_range] * var1) / 512;
		var calc_gas_res = (var3 + (var2 / 2)) / var2;
		// console.log("calib:\n_LOOKUP_TABLE_1:",this._LOOKUP_TABLE_1,"\n:_LOOKUP_TABLE_2:",this._LOOKUP_TABLE_2,"\n_sw_err:",this._sw_err,"\ngas_raw:adc:",this._adc_gas,"  range:",this._gas_range);
		return Math.floor(calc_gas_res);
	},
	_read24: function(b1,b2,b3){
		return ( ((b1 & 0xFF) * 256 + (b2 & 0xFF)) * 256 + (b3 & 0xFF) );
	},
	getSVal1: function(val){
		// 1byte singned int
		if ( val & 0x80 ){
			return (( -val ^ 0xFF) + 1);
		} else {
			return ( val );
		}
	},
	getSVal2: function(val){
		// 2byte singned int
		if ( val & 0x8000 ){
			return (( -val ^ 0xFFFF) + 1);
		} else {
			return ( val );
		}
	},
};

export default BME680;
