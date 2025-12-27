// @ts-check

// ScioSense ENS160 digital multi-gas sensor driver for CHIRIMEN
// Temperature and Humidity I2C Sensor
// based on https://github.com/adafruit/Adafruit_CircuitPython_ENS160/
// and https://www.mouser.com/datasheet/2/1081/SC_001224_DS_1_ENS160_Datasheet_Rev_0_95-2258311.pdf
// Programmed by Satoru Takagi

/** @param {number} ms Delay for a number of milliseconds. */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class ENS160 {
  /**
   * @constructor
   * @param {import('node-web-i2c').I2CPort} i2cPort I2C port instance
   * @param {number?} slaveAddress I2C slave address
   */
  constructor(i2cPort, slaveAddress) {
    if (!slaveAddress) {
      slaveAddress = 0x53;
    }
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;

    this._ENS160_REG_PARTID = 0x00;
    this._ENS160_REG_OPMODE = 0x10;
    this._ENS160_REG_CONFIG = 0x11;
    this._ENS160_REG_COMMAND = 0x12;
    this._ENS160_REG_TEMPIN = 0x13;
    this._ENS160_REG_RHIN = 0x15;
    this._ENS160_REG_TEMPC = 0x30;
    this._ENS160_REG_RHC = 0x32;
    this._ENS160_REG_STATUS = 0x20;
    this._ENS160_REG_AQI = 0x21;
    this._ENS160_REG_TVOC = 0x22;
    this._ENS160_REG_ECO2 = 0x24;
    this._ENS160_REG_GPRREAD = 0x48;

    this.MODE_SLEEP = 0x00;
    this.MODE_IDLE = 0x01;
    this.MODE_STANDARD = 0x02;
    this.MODE_RESET = 0xf0;
    this._valid_modes = [
      this.MODE_SLEEP,
      this.MODE_IDLE,
      this.MODE_STANDARD,
      this.MODE_RESET,
    ];

    this.NORMAL_OP = 0x00;
    this.WARM_UP = 0x01;
    this.START_UP = 0x02;
    this.INVALID_OUT = 0x03;

    this.COMMAND_NOP = 0x00;
    this.COMMAND_CLRGPR = 0xcc;
    this.COMMAND_GETAPPVER = 0x0e;
  }
  async init() {
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);

    var part_id = await this.i2cSlave.read16(this._ENS160_REG_PARTID);
    console.log("part_id:", part_id.toString(16));
    await this.clear_command();
    await this.i2cSlave.write8(this._ENS160_REG_OPMODE, this.MODE_STANDARD);
    await this.set_temperature(25);
    await this.set_humidity(50);
    //console.log( "T:",await this.get_temperature());
    //console.log( "H:",await this.get_humidity());
    //console.log("FWVER:",(await this.get_version()).toString(2));
  }
  async set_temperature(t) {
    var ti = Math.floor((t + 273.15) * 64.0 + 0.5);
    await this.i2cSlave.write16(this._ENS160_REG_TEMPIN, ti);
  }
  async set_humidity(h) {
    var hi = Math.floor(h * 512 + 0.5);
    await this.i2cSlave.write16(this._ENS160_REG_RHIN, hi);
  }
  async get_temperature() {
    var ti = await this.i2cSlave.read16(this._ENS160_REG_TEMPC);
    return ti / 64.0 - 273.15;
  }
  async get_humidity() {
    var hi = await this.i2cSlave.read16(this._ENS160_REG_RHC);
    return hi / 512;
  }
  async get_data() {
    var AQI = await this.get_AQI();
    var TVOC = await this.get_TVOC();
    var eCO2 = await this.get_eCO2();
    return { AQI, TVOC, eCO2 };
  }
  async get_AQI() {
    // 1..5
    return await this.i2cSlave.read8(this._ENS160_REG_AQI);
  }
  async get_TVOC() {
    // [ppb]
    return await this.i2cSlave.read16(this._ENS160_REG_TVOC);
  }
  async get_eCO2() {
    // [ppm]
    return await this.i2cSlave.read16(this._ENS160_REG_ECO2);
  }
  async get_status() {
    return await this.i2cSlave.read8(this._ENS160_REG_STATUS);
  }
  async clear_command() {
    await this.i2cSlave.write8(this._ENS160_REG_COMMAND, this.COMMAND_NOP);
    await this.i2cSlave.write8(this._ENS160_REG_COMMAND, this.COMMAND_CLRGPR);
    await sleep(10);
  }
  async get_mode() {
    return await this.i2cSlave.read8(this._ENS160_REG_OPMODE);
  }
}

export default ENS160;
