// @ts-check

// BH1750 driver for CHIRIMEN WebI2C
// ported from https://gist.github.com/oskar456/95c66d564c58361ecf9f
// by Satoru Takagi

/** @param {number} ms Delay for a number of milliseconds. */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class BH1750 {
  /**
   * @constructor
   * @param {import('node-web-i2c').I2CPort} i2cPort I2C port instance
   * @param {number?} slaveAddress I2C slave address
   */
  constructor(i2cPort, slaveAddress) {
    this.digP = [];
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    if (slaveAddress) {
      this.slaveAddress = slaveAddress;
    } else {
      this.slaveAddress = 0x23;
    }

    this.POWER_DOWN = 0x00; // No active state
    this.POWER_ON = 0x01; // Power on
    this.RESET = 0x07; // Reset data register value
    this.CONTINUOUS_LOW_RES_MODE = 0x13;
    this.CONTINUOUS_HIGH_RES_MODE_1 = 0x10;
    this.CONTINUOUS_HIGH_RES_MODE_2 = 0x11;
    this.ONE_TIME_HIGH_RES_MODE_1 = 0x20;
    this.ONE_TIME_HIGH_RES_MODE_2 = 0x21;
    this.ONE_TIME_LOW_RES_MODE = 0x23;
  }
  async init() {
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
    await this.power_down();
    await this.set_sensitivity();
  }
  async _set_mode(mode) {
    this.mode = mode;
    this.i2cSlave.writeByte(mode);
  }
  async power_down() {
    await this._set_mode(this.POWER_DOWN);
  }
  async power_on() {
    await this._set_mode(this.POWER_ON);
  }
  async reset() {
    await this.power_on();
    await this._set_mode(this.RESET);
  }
  async cont_low_res() {
    await this._set_mode(this.CONTINUOUS_LOW_RES_MODE);
  }
  async cont_high_res() {
    await this._set_mode(this.CONTINUOUS_HIGH_RES_MODE_1);
  }
  async cont_high_res2() {
    await this._set_mode(this.CONTINUOUS_HIGH_RES_MODE_2);
  }
  async oneshot_low_res() {
    await this._set_mode(this.ONE_TIME_LOW_RES_MODE);
  }
  async oneshot_high_res() {
    await this._set_mode(this.ONE_TIME_HIGH_RES_MODE_1);
  }
  async oneshot_high_res2() {
    await this._set_mode(this.ONE_TIME_HIGH_RES_MODE_2);
  }
  async set_sensitivity(sensitivity) {
    //Set the sensor sensitivity.
    //Valid values are 31 (lowest) to 254 (highest), default is 69.
    if (!sensitivity) {
      sensitivity = 69;
    }
    if (sensitivity < 31) {
      this.mtreg = 31;
    } else if (sensitivity > 254) {
      this.mtreg = 254;
    } else {
      this.mtreg = sensitivity;
    }
    await this.power_on();
    await this._set_mode(0x40 | (this.mtreg >> 5));
    await this._set_mode(0x60 | (this.mtreg & 0x1f));
    await this.power_down();
  }
  async get_result() {
    // Return current measurement result in lx.
    var data = await this.i2cSlave.readBytes(2);
    var count = data[1] | (data[0] << 8);
    var mode2coeff = 1;
    if (
      this.mode == this.ONE_TIME_HIGH_RES_MODE_2 ||
      this.mode == this.CONTINUOUS_HIGH_RES_MODE_2
    ) {
      mode2coeff = 2;
    }
    var ratio = 1 / (1.2 * (this.mtreg / 69.0) * mode2coeff);
    return ratio * count;
  }
  async wait_for_result(additional) {
    if (!additional) {
      additional = 0;
    }
    //        var basetime = 0.128;
    var basetime = 0.14;
    if ((this.mode & 0x03) == 0x03) {
      //			basetime= 0.018;
      basetime = 0.03;
    }

    await sleep(1000 * (basetime * (this.mtreg / 69.0) + additional));
  }
  async do_measurement(mode, additional_delay) {
    /**
        Perform complete measurement using command
        specified by parameter mode with additional
        delay specified in parameter additional_delay.
        Return output value in Lx.
        **/
    if (!additional_delay) {
      additional_delay = 0;
    }

    await this.reset();
    await this._set_mode(mode);
    await this.wait_for_result(additional_delay);
    return await this.get_result();
  }
  async measure_low_res(additional_delay) {
    return await this.do_measurement(
      this.ONE_TIME_LOW_RES_MODE,
      additional_delay,
    );
  }
  async measure_high_res(additional_delay) {
    return await this.do_measurement(
      this.ONE_TIME_HIGH_RES_MODE_1,
      additional_delay,
    );
  }
  async measure_high_res2(additional_delay) {
    return await this.do_measurement(
      this.ONE_TIME_HIGH_RES_MODE_2,
      additional_delay,
    );
  }
}

export default BH1750;
