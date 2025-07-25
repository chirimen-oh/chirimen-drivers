// @ts-check
// grove-water-level-sensor driver for CHIRIMEN
// Based from https://github.com/SeeedDocument/Grove-Water-Level-Sensor/blob/master/water-level-sensor-demo.ino
// Programmed by Masahito Inoue

const THRESHOLD = 100;

class WaterLevelSensor {
  // Since the addresses at the top and bottom of the sensor are different, initialize each address separately.
  constructor(i2cPort, slaveAddressLow, slaveAddressHigh) {
    this.i2cPort = i2cPort;
    this.i2cSlaveLow = null;
    this.i2cSlaveHigh = null;
    this.slaveAddressLow = slaveAddressLow;
    this.slaveAddressHigh = slaveAddressHigh;
  }

  async init() {
    this.i2cSlaveLow = await this.i2cPort.open(this.slaveAddressLow);
    this.i2cSlaveHigh = await this.i2cPort.open(this.slaveAddressHigh);
  }

  async getHigh12SectionValue() {
    if (this.i2cSlaveHigh == null) {
      throw new Error("i2cSlaveHigh is not open yet.");
    }

    const high12SectionValue = await this.i2cSlaveHigh.readBytes(12);

    return high12SectionValue;
  }

  async getLow8SectionValue() {
    if (this.i2cSlaveLow == null) {
      throw new Error("i2cSlaveLow is not open yet.");
    }

    const low8SectionValue = await this.i2cSlaveLow.readBytes(8);

    return low8SectionValue;
  }

  async getWaterLevel() {
    const high_data = await this.getHigh12SectionValue();
    const low_data = await this.getLow8SectionValue();
    let touch_val = 0;
    let trig_section = 0;

    for (let i = 0 ; i < 8; i++) {
      if (low_data[i] > THRESHOLD) {
        touch_val |= 1 << i;
      }
    }
    for (let i = 0 ; i < 12; i++) {
      if (high_data[i] > THRESHOLD) {
        touch_val |= 1 << (8 + i);
      }
    }

    // Check if the least significant bit is 1.
    while (touch_val & 0x01)
    {
      trig_section++;
      touch_val >>= 1;
    }

    // Since there are 20 sensor sections, multiply by 5 to convert to a percentage.
    const value = trig_section * 5;

    return value;
  }
}

export default WaterLevelSensor;