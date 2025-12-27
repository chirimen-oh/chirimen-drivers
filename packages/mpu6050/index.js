// @ts-check

// based on http://www.widesnow.com/entry/2015/09/10/061128
// https://www.invensense.com/wp-content/uploads/2015/02/MPU-6000-Register-Map1.pdf

/**
 * MPU6050 6-axis accelerometer and gyroscope driver
 * @constructor
 * @param {import('node-web-i2c').I2CPort} i2cPort I2C port instance
 * @param {number} [slaveAddress=0x68] - I2C slave address
 */
class MPU6050 {
  constructor(i2cPort, slaveAddress) {
    this.i2cPort = i2cPort;
    /** @type {import('node-web-i2c').I2CSlaveDevice | null} */
    this.i2cSlave = null;
    if (slaveAddress) {
      this.slaveAddress = slaveAddress;
    } else {
      this.slaveAddress = 0x68;
    }
  }
  /**
   * Initialize the sensor
   * @returns {Promise<void>}
   */
  async init() {
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
    await this.i2cSlave.write8(0x6b, 0x00);
  }
  /**
   * Read temperature
   * @returns {Promise<number>} Temperature in Celsius
   */
  async readTemp() {
    if (this.i2cSlave == null) {
      throw Error("i2cSlave Address does'nt yet open!");
    }
    var ans = await this.i2cSlave.read16(0x41);
    //         var data = ((MSB << 8) + LSB)/128.0;
    var temp = ans / 340 + 36.53;
    return temp;
  }
  /**
   * Read all sensor data (temperature, accelerometer, gyroscope)
   * @returns {Promise<{temperature: number, gx: number, gy: number, gz: number, rx: number, ry: number, rz: number}>}
   */
  async readAll() {
    if (this.i2cSlave == null) {
      throw Error("i2cSlave Address does'nt yet open!");
    }
    var ans = await this.i2cSlave.read16(0x41);
    var temp = this.getVal(ans) / 340 + 36.53;
    ans = await this.i2cSlave.read16(0x43);
    var rx = this.getVal(ans) / 131;
    ans = await this.i2cSlave.read16(0x45);
    var ry = this.getVal(ans) / 131;
    ans = await this.i2cSlave.read16(0x47);
    var rz = this.getVal(ans) / 131;
    ans = await this.i2cSlave.read16(0x3b);
    var gx = this.getVal(ans) / 16384;
    ans = await this.i2cSlave.read16(0x3d);
    var gy = this.getVal(ans) / 16384;
    ans = await this.i2cSlave.read16(0x3f);
    var gz = this.getVal(ans) / 16384;
    return {
      temperature: temp,
      gx: gx,
      gy: gy,
      gz: gz,
      rx: rx,
      ry: ry,
      rz: rz,
    };
  }
  async wake() {
    if (this.i2cSlave == null) {
      throw Error("i2cSlave Address does'nt yet open!");
    }
    await this.i2cSlave.write8(0x6b, 0x00);
  }
  async reset() {
    // deep sleep?
    if (this.i2cSlave == null) {
      throw Error("i2cSlave Address does'nt yet open!");
    }
    await this.i2cSlave.write8(0x6b, 0x80);
  }
  getVal(w) {
    var l = w >>> 8;
    var b = w & 0xff;
    var v = l + (b << 8);
    return new Int16Array([v])[0];
  }
}

export default MPU6050;
