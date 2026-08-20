// @ts-check

// STHS34PF80 driver for CHIRIMEN

// https://www.st.com/resource/en/datasheet/sths34pf80.pdf
const ADDRESS = 0x5A;

// Registers
const WHO_AM_I = 0x0F;
const CTRL1 = 0x20;
const STATUS = 0x23;
const FUNC_STATUS = 0x25;
const TOBJECT_L = 0x26;
const TOBJECT_H = 0x27;
const TAMBIENT_L = 0x28;
const TAMBIENT_H = 0x29;

class STHS34PF80 {
  constructor(i2cPort, slaveAddress = ADDRESS) {
    this.i2cPort = i2cPort;
    this.slaveAddress = slaveAddress;
    this.i2cSlave = null;
  }

  async init() {
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);

    // BDU = 1, ODR = 4 Hz
    await this.i2cSlave.write8(CTRL1, 0x15);
  }

  async readWhoAmI() {
    return await this.i2cSlave.read8(WHO_AM_I);
  }

  async readStatus() {
    return await this.i2cSlave.read8(STATUS);
  }

  async readFunctionStatus() {
    return await this.i2cSlave.read8(FUNC_STATUS);
  }

  async readObjectTemperatureRaw() {
    const low = await this.i2cSlave.read8(TOBJECT_L);
    const high = await this.i2cSlave.read8(TOBJECT_H);

    let value = (high << 8) | low;

    // Convert unsigned 16-bit to signed 16-bit
    if (value & 0x8000) {
      value -= 0x10000;
    }

    return value;
  }

  async readAmbientTemperatureRaw() {
    const low = await this.i2cSlave.read8(TAMBIENT_L);
    const high = await this.i2cSlave.read8(TAMBIENT_H);

    let value = (high << 8) | low;

    // Convert unsigned 16-bit to signed 16-bit
    if (value & 0x8000) {
      value -= 0x10000;
    }

    return value;
  }

  async read() {
    const objectRaw = await this.readObjectTemperatureRaw();
    const ambientRaw = await this.readAmbientTemperatureRaw();

    return {
      objectTemperatureRaw: objectRaw,
      ambientTemperatureRaw: ambientRaw,
      ambientTemperature: ambientRaw / 100
    };
  }
}

export default STHS34PF80;
