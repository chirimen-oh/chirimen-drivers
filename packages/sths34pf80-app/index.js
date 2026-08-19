// @ts-check

// STHS34PF80 driver for CHIRIMEN

class STHS34PF80 {
  /**
   * @constructor
   * @param {import('node-web-i2c').I2CPort} i2cPort I2C port instance
   * @param {number?} slaveAddress I2C slave address
   */
  constructor(i2cPort, slaveAddress) {
    if (!slaveAddress) {
      slaveAddress = 0x5A;
    }

    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;
  }

  async init() {
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
  }

  async readWhoAmI() {
    return await this.i2cSlave.read8(0x0F);
  }

  async readStatus() {
    return await this.i2cSlave.read8(0x23);
  }

  async readFuncStatus() {
    return await this.i2cSlave.read8(0x25);
  }

  async readTObject() {
    const low = await this.i2cSlave.read8(0x26);
    const high = await this.i2cSlave.read8(0x27);

    let value = low | (high << 8);

    if (value & 0x8000) {
      value = value - 0x10000;
    }

    return value;
  }

  async readTAmbient() {
    const low = await this.i2cSlave.read8(0x28);
    const high = await this.i2cSlave.read8(0x29);

    let value = low | (high << 8);

    if (value & 0x8000) {
      value = value - 0x10000;
    }

    return value;
  }

  async readTAmbientCelsius() {
    const raw = await this.readTAmbient();
    return raw / 100;
  }
}

export default STHS34PF80;
