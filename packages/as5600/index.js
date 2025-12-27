// @ts-check

// AS5600 : 12-Bit Programmable Contactless Potentiometer
// driver for WebI2C
// Programmed by Satoru Takagi
//
// https://ams.com/documents/20143/36005/AS5600_DS000365_5-00.pdf
// https://qiita.com/GANTZ/items/63a66161a5a7eeaf6a62
//

class AS5600 {
  /**
   * @constructor
   * @param {import('node-web-i2c').I2CPort} i2cPort I2C port instance
   * @param {number?} slaveAddress I2C slave address
   */
  constructor(i2cPort, slaveAddress) {
    if (!slaveAddress) {
      slaveAddress = 0x36;
    }
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;
  }
  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  async init() {
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
  }
  async getRawStatus() {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }
    var stat = await this.i2cSlave.read8(0x0b);
    return stat;
  }
  async getStatus() {
    const rstat = await this.getRawStatus();
    const mh = (rstat >> 3) & 1;
    const ml = (rstat >> 4) & 1;
    const md = (rstat >> 5) & 1;
    return {
      detected: Boolean(md),
      tooLow: Boolean(ml),
      tooHigh: Boolean(mh),
    };
  }
  async getRawAngle() {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }
    await this.i2cSlave.writeByte(0x0c);
    const ans = await this.i2cSlave.readBytes(2); // オートインクリメントを利用
    const angle = (ans[0] << 8) | ans[1];
    return angle;
  }
  async getAngle() {
    const angle = (360 * (await this.getRawAngle())) / 4096;
    return angle;
  }
}

export default AS5600;
