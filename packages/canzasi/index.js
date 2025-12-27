// @ts-check

class Canzasi {
  /**
   * @constructor
   * @param {import('node-web-i2c').I2CPort} i2cPort I2C port instance
   */
  constructor(i2cPort) {
    this.i2cPort = i2cPort;
    this.slaveAddress = 0x30;
    this.i2cSlave = null;
  }

  async init() {
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
  }
  async set(value) {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is gone.....");
    }
    await this.i2cSlave.writeByte(value);
  }
}

export default Canzasi;
