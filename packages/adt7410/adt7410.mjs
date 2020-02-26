const ADT7410 = function(i2cPort, slaveAddress) {
  this.i2cPort = i2cPort;
  this.i2cSlave = null;
  this.slaveAddress = slaveAddress;
};

ADT7410.prototype = {
  init: async function() {
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
  },
  read: async function() {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }

    const MSB = await this.i2cSlave.read8(0x00);
    const LSB = await this.i2cSlave.read8(0x01);
    const rawData = ((MSB << 8) + LSB) >> 3;
    if (MSB < 16) {
      // Positive value
      return rawData / 16.0;
    } else {
      // Negative value
      return (rawData - 8192) / 16.0;
    }
  }
};

export default ADT7410;
