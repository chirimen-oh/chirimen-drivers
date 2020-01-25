// @ts-check

/** @param {number} ms Delay for a number of milliseconds. */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

var ADS1015 = function (i2cPort, slaveAddress) {
  this.i2cPort = i2cPort;
  this.slaveAddress = slaveAddress;
  this.i2cSlave = null;
};

ADS1015.prototype = {
  init: async function () {
    try {
      this.i2cSlave = await this.i2cPort.open(this.slaveAddress)
    } catch (error) {
      console.error("ADS1015.init() Error: " + error.message);
      throw error;
    }
  },
  read: async function (channel) {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }

    if ((channel < 0) || (3 < channel)) {
      throw new Error("ADS1015.read: channel error" + channel);
    }

    var config = 0x4000 + (channel * 0x1000); // ADC channel
    config |= 0x8000; // Set 'start single-conversion' bit
    config |= 0x0003; // Disable the comparator (default val)
    config |= 0x0080; // 1600 samples per second (default)
    config |= 0x0100; // Power-down single-shot mode (default)
    config |= 0x0200; // +/-4.096V range = Gain 1
    var confL = config >> 8;
    var confH = config & 0x00ff;
    var data = confH | confL;

    try {
      await this.i2cSlave.write16(0x01, data);
    } catch (error) {
      throw new Error("ADS1015.read: write16(0,config) error" + error.message);
    }
    await sleep(10);
    var v;
    try {
      v = await this.i2cSlave.read16(0);
    } catch (error) {
      throw new Error("ADS1015.read: read16(0) error" + error.message);
    }
    var vH = (v & 0x00ff) << 8;
    var vL = (v >> 8) & 0x00ffff;
    var value = (vH | vL) >> 4;
    return value;
  }
};

export default ADS1015;
