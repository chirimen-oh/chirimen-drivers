var ADT7410 = function(i2cPort, slaveAddress) {
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

    var MSB = await this.i2cSlave.read8(0x00);
    var LSB = await this.i2cSlave.read8(0x01);
    var data = ((MSB << 8) + LSB) / 128.0;
    return data;
  }
};

export default ADT7410;
