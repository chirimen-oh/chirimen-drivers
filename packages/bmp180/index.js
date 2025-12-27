// @ts-check

// BMP180 driver for CHIRIMEN WebI2C
// ported from hhttps://qiita.com/uchino-tama/items/efccfe871ab3abc782f3
// by Satoru Takagi

class BMP180 {
  /**
   * @constructor
   * @param {import('node-web-i2c').I2CPort} i2cPort I2C port instance
   * @param {number?} slaveAddress I2C slave address
   */
  constructor(i2cPort, slaveAddress) {
    this.AC = [];
    this.B = [];
    this.M = [];
    this.t_fine = 0;
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    if (slaveAddress) {
      this.slaveAddress = slaveAddress;
    } else {
      this.slaveAddress = 0x77;
    }
  }
  async init() {
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
    await this.getCalibParam();
  }
  getSVal(val) {
    if (val & 0x8000) {
      return (-val ^ 0xffff) + 1;
    } else {
      return val;
    }
  }
  async getCalibParam() {
    var calib = [];
    var dat;
    var getSVal = this.getSVal;
    for (var ra = 0xaa; ra <= 0xaa + 21; ra++) {
      dat = await this.i2cSlave.read8(ra);
      calib.push(dat);
    }
    var AC = this.AC;
    var B = this.B;
    var M = this.M;
    AC.push(getSVal((calib[0] << 8) | calib[1])); // AC1 AC[0]
    AC.push(getSVal((calib[2] << 8) | calib[3])); // AC2
    AC.push(getSVal((calib[4] << 8) | calib[5])); // AC3
    AC.push((calib[6] << 8) | calib[7]); // uint AC4
    AC.push((calib[8] << 8) | calib[9]); // uint AC5
    AC.push((calib[10] << 8) | calib[11]); // uint AC6
    B.push(getSVal((calib[12] << 8) | calib[13])); // B1 B[0]
    B.push(getSVal((calib[14] << 8) | calib[15])); // B2
    M.push(getSVal((calib[16] << 8) | calib[17])); // MB M[0]
    M.push(getSVal((calib[18] << 8) | calib[19])); // MC
    M.push(getSVal((calib[20] << 8) | calib[21])); // MD
  }
  async readAndCalcB5() {
    var AC = this.AC;
    var M = this.M;

    await this.i2cSlave.write8(0xf4, 0x2e); // read temp.
    var dat0 = await this.i2cSlave.read8(0xf6);
    var dat1 = await this.i2cSlave.read8(0xf7);
    var UT = (dat0 << 8) | dat1;
    var X1 = ((UT - AC[5]) * AC[4]) >> 15;
    var X2 = (M[1] << 11) / (X1 + M[2]);
    var B5 = X1 + X2;
    return B5;
  }
  async readTemperature() {
    var b5 = await this.readAndCalcB5();
    return ((b5 + 8) >> 4) / 10.0;
  }
  async readPressure() {
    var AC = this.AC;
    var B = this.B;
    var mode = 1; // standard mode      0:ULPW,1:STD,2:HIRES,3:UHIRES
    await this.i2cSlave.write8(0xf4, 0x34 + (mode << 6)); // read pressure standard mode

    await this.sleep(5 + 3 * mode * mode);

    var data = [];
    var dat;
    for (var ra = 0xf6; ra <= 0xf6 + 2; ra++) {
      dat = await this.i2cSlave.read8(ra);
      data.push(dat);
    }
    var UP = ((data[0] << 16) | (data[1] << 8) | data[2]) >> (8 - mode);

    // Calibration for Pressure
    var B6 = (await this.readAndCalcB5()) - 4000;
    var X1 = ((B[1] * (B6 * B6)) >> 12) >> 11;
    var X2 = (AC[1] * B6) >> 11;
    var X3 = X1 + X2;
    var B3 = (((AC[0] * 4 + X3) << mode) + 2) / 4;

    X1 = (AC[2] * B6) >> 13;
    X2 = (B[0] * ((B6 * B6) >> 12)) >> 16;
    X3 = (X1 + X2 + 2) >> 2;
    var B4 = (AC[3] * (X3 + 32768)) >> 15;
    var B7 = (UP - B3) * (50000 >> mode);

    var p = B7 < 0x80000000 ? (B7 * 2) / B4 : (B7 / B4) * 2;

    X1 = (p >> 8) * (p >> 8);
    X1 = (X1 * 3038) >> 16;
    X2 = (-7357 * p) >> 16;
    p = p + ((X1 + X2 + 3791) >> 4);

    return p / 100.0;
  }
  sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }
}

export default BMP180;
