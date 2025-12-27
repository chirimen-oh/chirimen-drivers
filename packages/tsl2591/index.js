// @ts-check

// TSL2591 driver for WebI2C
// https://www.waveshare.com/wiki/Environment_Sensor_HAT
// https://www.waveshare.com/wiki/TSL25911_Light_Sensor
// の
// https://files.waveshare.com/upload/b/bc/Environment_Sensor_HAT_Code.7z
// をベースに移植
// TSL25911FN == TSL2591
// 2023/12/13 Ported by Satoru Takagi

class TSL2591 {
  /**
   * @constructor
   * @param {import('node-web-i2c').I2CPort} i2cPort I2C port instance
   * @param {number?} slaveAddress I2C slave address
   */
  constructor(i2cPort, slaveAddress) {
    if (!slaveAddress) {
      slaveAddress = 0x29;
    }
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;
    this.ch0 = null;
    this.ch1 = null;

    // CONSTS
    this.COMMAND_BIT = 0xa0;
    this.ENABLE_REGISTER = 0x00;
    this.ENABLE_POWERON = 0x01;
    this.ENABLE_POWEROFF = 0x00;
    this.ENABLE_AEN = 0x02;
    this.ENABLE_AIEN = 0x10;
    this.ENABLE_SAI = 0x40;
    this.ENABLE_NPIEN = 0x80;

    this.CONTROL_REGISTER = 0x01;
    this.SRESET = 0x80;

    this.AILTL_REGISTER = 0x04;
    this.AILTH_REGISTER = 0x05;
    this.AIHTL_REGISTER = 0x06;
    this.AIHTH_REGISTER = 0x07;
    this.NPAILTL_REGISTER = 0x08;
    this.NPAILTH_REGISTER = 0x09;
    this.NPAIHTL_REGISTER = 0x0a;
    this.NPAIHTH_REGISTER = 0x0b;

    this.PERSIST_REGISTER = 0x0c;

    this.ID_REGISTER = 0x12;

    this.STATUS_REGISTER = 0x13;

    this.CHAN0_LOW = 0x14;
    this.CHAN0_HIGH = 0x15;
    this.CHAN1_LOW = 0x16;
    this.CHAN1_HIGH = 0x17;

    this.LUX_DF = 408.0;
    this.LUX_COEFB = 1.64;
    this.LUX_COEFC = 0.59;
    this.LUX_COEFD = 0.86;

    this.LOW_AGAIN = 0x00; //Low gain (1x)
    this.MEDIUM_AGAIN = 0x10; //Medium gain (25x)
    this.HIGH_AGAIN = 0x20; //High gain (428x)
    this.MAX_AGAIN = 0x30; //Max gain (9876x)

    this.ATIME_100MS = 0x00; //100 millis #MAX COUNT 36863
    this.ATIME_200MS = 0x01; //200 millis #MAX COUNT 65535
    this.ATIME_300MS = 0x02; //300 millis
    this.ATIME_400MS = 0x03; //400 millis
    this.ATIME_500MS = 0x04; //500 millis
    this.ATIME_600MS = 0x05; //600 millis

    this.MAX_COUNT_100MS = 36863; // 0x8FFF
    this.MAX_COUNT = 65535; // 0xFFFF
    this.INI_PIN = 23;
  }
  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
  async init() {
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
    this.ID = await this.Read_Byte(this.ID_REGISTER);
    if (this.ID != 0x50) {
      console.error(`invalid ID : ${this.ID}`);
      return;
    }
    await this.Write_Byte(
      this.ENABLE_REGISTER,
      this.ENABLE_AIEN |
        this.ENABLE_POWERON |
        this.ENABLE_AEN |
        this.ENABLE_NPIEN,
    );
    this.IntegralTime = this.ATIME_200MS;
    this.Gain = this.MEDIUM_AGAIN;
    await this.Write_Byte(this.CONTROL_REGISTER, this.IntegralTime | this.Gain);
    await this.Write_Byte(this.PERSIST_REGISTER, 0x01);
    var atime = 100.0 * this.IntegralTime + 100.0;
    var again = 1.0;
    if (this.Gain == this.MEDIUM_AGAIN) {
      again = 25.0;
    } else if (this.Gain == this.HIGH_AGAIN) {
      again = 428.0;
    } else if (this.Gain == this.MAX_AGAIN) {
      again = 9876.0;
    }
    this.Cpl = (atime * again) / this.LUX_DF;
  }

  async Read_Byte(Addr) {
    const addr = (this.COMMAND_BIT | Addr) & 0xff;
    var ans = await this.i2cSlave.read8(addr);
    return ans;
  }
  async Write_Byte(Addr, val) {
    const addr = (this.COMMAND_BIT | Addr) & 0xff;
    await this.i2cSlave.write8(addr, val);
  }

  async Read_2Channel() {
    var CH0L = await this.Read_Byte(this.CHAN0_LOW);
    var CH0H = await this.Read_Byte(this.CHAN0_LOW + 1);
    var CH1L = await this.Read_Byte(this.CHAN0_LOW + 2);
    var CH1H = await this.Read_Byte(this.CHAN0_LOW + 3);
    var full = (CH0H << 8) | CH0L;
    var ir = (CH1H << 8) | CH1L;
    return [full, ir];
  }

  async Lux() {
    var status = await this.Read_Byte(0x13);
    if (status & 0x10) {
      // console.log ('soft goto interrupt');
      await this.Write_Byte(0xe7, 0x13);
    }

    var [full, ir] = await this.Read_2Channel();
    if (full == 0xffff || ir == 0xffff) {
      console.error("Numerical overflow!");
      return;
    }

    var lux = ((full - ir) * (1.0 - ir / full)) / this.Cpl;
    return lux;
  }
}

export default TSL2591;
