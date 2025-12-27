// @ts-check

/** @param {number} ms Delay for a number of milliseconds. */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class SteppingMotor {
  constructor(i2cPort, slaveAddress) {
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;
  }
  async init() {
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
    await this.i2cSlave.write16(0x03, 0);
  }
  async readStatus() {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }

    const data = await this.i2cSlave.read8(0x00);
    return data;
  }
  async move(step) {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }

    if (step > 0) {
      await this.i2cSlave.write16(0x01, step | 0);
    }
    if (step < 0) {
      await this.i2cSlave.write16(0x02, -step | 0);
    }

    for (;;) {
      const busy = await this.i2cSlave.read8(0x00);
      if (busy == 0) return;
      await sleep(100);
    }
  }
  async abort() {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }

    await this.i2cSlave.write16(0x03, 0);
  }
  async setSpeed(speed) {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }

    await this.i2cSlave.write16(0x04, speed | 0);
  }
  async setMinSpeed(speed) {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }

    await this.i2cSlave.write16(0x05, speed);
  }
  async setAccelRate(rate) {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }

    await this.i2cSlave.write16(0x06, rate);
  }
  async enable(en) {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }

    await this.i2cSlave.write16(0x07, en ? 1 : 0);
  }
}

export default SteppingMotor;
