// @ts-check

class GP2Y0E03 {
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
  /**
   * @param {number} ms
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  /**
   * Initialize the sensor
   * @returns {Promise<void>}
   */
  init() {
    return new Promise((resolve, reject) => {
      this.i2cPort
        .open(this.slaveAddress)
        .then(async (i2cSlave) => {
          this.i2cSlave = i2cSlave;
          await this.i2cSlave.write8(0xee, 0x06); // Software Reset
          await this.sleep(10);
          resolve();
        })
        .catch((reason) => {
          reject(reason);
        });
    });
  }
  compose(shift, dist_h, dist_l) {
    var val = null;
    if (dist_l >= 0 && dist_l < 16 && dist_h != 255) {
      switch (shift) {
        case 1:
          val = ((dist_h << 4) + dist_l) / 128;
          break;
        case 2:
          val = ((dist_h << 4) + dist_l) / 64;
          break;
        default:
          break;
      }
    }
    return val;
  }
  async read() {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }

    var shift = await this.i2cSlave.read8(0x35); // Shift Bit
    var dist_h = await this.i2cSlave.read8(0x5e); // Distance[11:4]
    var dist_l = await this.i2cSlave.read8(0x5f); // Distance[3:0]
    var distance = this.compose(shift, dist_h, dist_l);
    return distance;
  }
}

export default GP2Y0E03;
