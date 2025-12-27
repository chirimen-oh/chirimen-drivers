// @ts-check

/** @param {number} ms Delay for a number of milliseconds. */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * ADS1015 ADC driver
 * @constructor
 * @param {import('node-web-i2c').I2CPort} i2cPort I2C port instance
 * @param {number} slaveAddress I2C slave address
 */
class ADS1015 {
  constructor(i2cPort, slaveAddress) {
    this.i2cPort = i2cPort;
    this.slaveAddress = slaveAddress;
    /** @type {import('node-web-i2c').I2CSlaveDevice | null} */
    this.i2cSlave = null;
  }

  /**
   * Initialize the sensor
   * @returns {Promise<void>}
   */
  async init() {
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
  }
  /**
   * Read ADC value from specified channel
   * @param {number} channel - ADC channel (0-3)
   * @returns {Promise<number>} ADC value
   */
  async read(channel) {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }

    if (channel < 0 || 3 < channel) {
      throw new Error("ADS1015.read: channel error" + channel);
    }

    var config = 0x4000 + channel * 0x1000; // ADC channel
    config |= 0x8000; // Set 'start single-conversion' bit
    config |= 0x0003; // Disable the comparator (default val)
    config |= 0x0080; // 1600 samples per second (default)
    config |= 0x0100; // Power-down single-shot mode (default)
    config |= 0x0200; // +/-4.096V range = Gain 1
    var confL = config >> 8;
    var confH = config & 0x00ff;
    var data = confH | confL;
    await this.i2cSlave.write16(0x01, data);
    await sleep(10);
    var v = await this.i2cSlave.read16(0);
    var vH = (v & 0x00ff) << 8;
    var vL = (v >> 8) & 0x00ffff;
    var value = (vH | vL) >> 4;
    return value;
  }
}

export default ADS1015;
