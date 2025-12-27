// @ts-check

// MMA7660 driver for CHIRIMEN
// Based from https://github.com/Seeed-Studio/Accelerometer_MMA7660/blob/master/MMA7660.cpp
// Programmed by Masahito Inoue

const MMA7660_MODE = 0x07;
const MMA7660_STAND_BY = 0x00;
const MMA7660_ACTIVE = 0x01;
const MMA7660_SR = 0x08; //sample rate register
const AUTO_SLEEP_32 = 0x02;
const ACCELERATION_DIVISOR = 21.0;

class MMA7660 {
  /**
   * @constructor
   * @param {import('node-web-i2c').I2CPort} i2cPort I2C port instance
   * @param {number} slaveAddress I2C slave address
   */
  constructor(i2cPort, slaveAddress) {
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;
  }

  async init() {
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
    await this.i2cSlave.write8(MMA7660_MODE, MMA7660_STAND_BY);
    await this.i2cSlave.write8(MMA7660_SR, AUTO_SLEEP_32);
    await this.i2cSlave.write8(MMA7660_MODE, MMA7660_ACTIVE);
  }

  async getXYZ() {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }

    const XYZresult = await this.i2cSlave.readBytes(3);

    const signedValueArray = Array.from(
      XYZresult,
      /** @param {number} value */ (value) => {
        // Perform noise reduction with bit masks
        let newValue = value & 0x3f;
        // Converting 6-bit output results to signed values
        if (newValue >= 32) {
          newValue = newValue - 64;
        }
        return newValue;
      },
    );

    const XYZdata = {
      X: signedValueArray[0],
      Y: signedValueArray[1],
      Z: signedValueArray[2],
    };

    return XYZdata;
  }

  async getAcceleration() {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }

    const XYZdata = await this.getXYZ();

    const AccelerationData = {
      X: XYZdata.X / ACCELERATION_DIVISOR,
      Y: XYZdata.Y / ACCELERATION_DIVISOR,
      Z: XYZdata.Z / ACCELERATION_DIVISOR,
    };

    return AccelerationData;
  }
}

export default MMA7660;
