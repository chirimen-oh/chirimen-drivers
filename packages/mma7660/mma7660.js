// @ts-check
// PCF8591 driver for CHIRIMEN
// Based from https://github.com/Seeed-Studio/Accelerometer_MMA7660/blob/master/MMA7660.cpp
// Programmed by Masahito inoue

const MMA7660_MODE = 0x07;
const MMA7660_STAND_BY = 0x00;
const MMA7660_ACTIVE = 0x01;
const MMA7660_SR = 0x08;      //sample rate register
const AUTO_SLEEP_32 = 0X02;

class MMA7660{
  constructor(i2cPort,slaveAddress){
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;
  }

  async init(){
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
    await this.i2cSlave.write8(MMA7660_MODE, MMA7660_STAND_BY);
    await this.i2cSlave.write8(MMA7660_SR, AUTO_SLEEP_32);
    await this.i2cSlave.write8(MMA7660_MODE, MMA7660_ACTIVE);
  }

  async getXYZ(){
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }

    const XYZresult = new Int8Array(await this.i2cSlave.readBytes(3));

    const XYZdata = {
      "X" : (XYZresult[0] << 2) / 4,
      "Y" : (XYZresult[1] << 2) / 4,
      "Z" : (XYZresult[2] << 2) / 4,
    };

    return XYZdata;
  }

  async getAcceleration(){
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }

    const XYZdata = await this.getXYZ();
    
    const AccelerationData = {
      "X" : XYZdata.X / 21.00,
      "Y" : XYZdata.Y / 21.00,
      "Z" : XYZdata.Z / 21.00,
    };

    return AccelerationData
  }
}

export default MMA7660;