// HT16K33 LED matrix driver for CHIRIMEN WebI2C
// by Satoru Takagi
// based on https://github.com/adafruit/Adafruit_Python_LED_Backpack/blob/master/Adafruit_LED_Backpack/HT16K33.py

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

var HT16K33 = function (i2cPort, slaveAddress) {
	console.log("instance HT16K33");
	if (!slaveAddress) {
		slaveAddress = 0x70;
	}
	this.i2cPort = i2cPort;
	this.i2cSlave = null;
	this.slaveAddress = slaveAddress;

	this.HT16K33_BLINK_CMD = 0x80;
	this.HT16K33_BLINK_DISPLAYON = 0x01;
	this.HT16K33_BLINK_OFF = 0x00;
	this.HT16K33_BLINK_2HZ = 0x02;
	this.HT16K33_BLINK_1HZ = 0x04;
	this.HT16K33_BLINK_HALFHZ = 0x06;
	this.HT16K33_SYSTEM_SETUP = 0x20;
	this.HT16K33_OSCILLATOR = 0x01;
	this.HT16K33_CMD_BRIGHTNESS = 0xe0;
	this.led8x8table = [
		7,0,1,2,3,4,5,6,
		23,16,17,18,19,20,21,22,
		39,32,33,34,35,36,37,38,
		55,48,49,50,51,52,53,54,
		71,64,65,66,67,68,69,70,
		87,80,81,82,83,84,85,86,
		103,96,97,98,99,100,101,102,
		119,112,113,114,115,116,117,118
	]; // 8x8マトリクスLEDの物理的な配置 (0:左上,63:右下) から、論理LED番号へ変換するテーブル
};

HT16K33.prototype = {
	init: async function(){
		this.buffer= new Array(16);
		this.clear();
		var i2cSlave = await this.i2cPort.open(this.slaveAddress);
		this.i2cSlave = i2cSlave;
		await this.i2cSlave.writeBytes([this.HT16K33_SYSTEM_SETUP | this.HT16K33_OSCILLATOR]);
		await this.set_blink(this.HT16K33_BLINK_OFF);
		await this.set_brightness(15);
	},
	set_blink: async function(frequency){
		if ( frequency != this.HT16K33_BLINK_OFF && 
			frequency != this.HT16K33_BLINK_2HZ &&
			frequency != this.HT16K33_BLINK_1HZ &&
			frequency != this.HT16K33_BLINK_HALFHZ ){
				console.error("Frequency must be one of ..");
				return;
		}
		await this.i2cSlave.writeBytes([this.HT16K33_BLINK_CMD | this.HT16K33_BLINK_DISPLAYON | frequency]);
	},
	set_brightness: async function(brightness){
		if (brightness < 0 || brightness > 15){
			console.error("Brightness must be a value of 0 to 15.");
			return;
		}
		await this.i2cSlave.writeBytes([this.HT16K33_CMD_BRIGHTNESS | brightness]);
	},
	set_led: function(led, value){ // ledは物理配置と関係ない論理番号
		if (led < 0 || led > 127){
			console.error("LED must be value of 0 to 127.");
			return;
		}
		var pos = Math.floor(led / 8);
		var offset = led % 8;
		if (!value){
			this.buffer[pos] = this.buffer[pos] & (~(1<<offset));
		} else {
			this.buffer[pos] = this.buffer[pos] | ((1<<offset));
		}
	},
	set_8x8_led: function(ledNum,value){ // ledNum:0..63
		if ( ledNum < 0 || ledNum > 63){
			console.error("8x8 ledNum shoud be 0..63");
			return;
		}
		var logicalLed = this.led8x8table[ledNum];
		this.set_led(logicalLed,value);
	},
	set_8x8_array: function(value){ // 64個の0||1配列
		if ( value.length != 64){
			console.error("The value must be an array of length 64.");
			return;
		}
		for ( var i = 0 ; i < 64 ; i++ ){
			this.set_8x8_led(i, value[i]);
		}
	},
	write_display: async function(){
		for ( var i = 0 ; i < this.buffer.length ; i++ ){
			// console.log(this.buffer[i].toString(16));
			await this.i2cSlave.write8(i , this.buffer[i]);
		}
	},
	clear: function(){
		for ( var i = 0 ; i < this.buffer.length ; i++ ){
			this.buffer[i]=0;
		}
	}
};

export default HT16K33;
