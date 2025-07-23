// @ts-check
// PCF8591 driver for CHIRIMEN
// based from https://github.com/adafruit/Adafruit_MCP9808_Library/blob/master/Adafruit_MCP9808.cpp
// Programmed by Haruka Terai

const MCP9808_I2CADDR_DEFAULT= 0x18;      ///< I2C address
const MCP9808_REG_CONFIG= 0x01;           ///< MCP9808 config register
const MCP9808_REG_CONFIG_SHUTDOWN= 0x0100 ///< shutdown config
const MCP9808_REG_AMBIENT_TEMP= 0x05      ///< ambient temperature
const MCP9808_REG_RESOLUTION= 0x08        ///< resolution

class MCP9808{
    constructor(i2cPort,slaveAddress){
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;
  }

  async init() {
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
    await this.write16(MCP9808_REG_CONFIG,0x0);
  }
  async readTempC(){
    let temp = null;
    const t = await this.read16(MCP9808_REG_AMBIENT_TEMP);

    if (t != 0xFFFF) {
       temp = t & 0x0FFF;
       temp /= 16.0;
       if (t & 0x1000){
         temp -= 256;
       }
    }
    return temp;
  }
  async readTempF(){
    let temp = null;
    const t = await this.read16(MCP9808_REG_AMBIENT_TEMP);

    if (t != 0xFFFF) {
       temp = t & 0x0FFF;
       temp /= 16.0;
       if (t & 0x1000){
         temp -= 256;
       }
       temp = temp * 9.0 / 5.0 + 32;
    }
    return temp;
  }
  async shutdown(){
    const conf_register = await this.read16(MCP9808_REG_CONFIG);
    const conf_shutdown = conf_register | MCP9808_REG_CONFIG_SHUTDOWN;
    await this.write16(MCP9808_REG_CONFIG, conf_shutdown);
  }
  wake(){
    return new Promise(async (resolve)=>{
      const conf_register = await this.read16(MCP9808_REG_CONFIG);
      const conf_shutdown = conf_register & ~MCP9808_REG_CONFIG_SHUTDOWN;
      await this.write16(MCP9808_REG_CONFIG, conf_shutdown);

      setTimeout(function() {
        console.log("260ms delay");
        return resolve();
      }, 260); 
    })
  }
  async getResolution(){
    return await this.i2cSlave.read8(MCP9808_REG_RESOLUTION);
  }
  async setResolution(value){
    // Mode Resolution SampleTime
    //  0    0.5°C       30 ms
    //  1    0.25°C      65 ms
    //  2    0.125°C     130 ms
    //  3    0.0625°C    250 ms
    await this.i2cSlave.write8(MCP9808_REG_RESOLUTION, value & 0x03);
  }
  async read16(reg){
    const value = await this.i2cSlave.read16(reg);
    // エンディアン変換
    const low = value & 0xFF;
    const high = (value >> 8) & 0xFF;
    return (low << 8) | high;
  }
  async write16(reg,value){
    // エンディアン変換
    const low = value & 0xFF;
    const high = (value >> 8) & 0xFF;
    await this.i2cSlave.write16(reg,((low << 8) | high));
  }
}
export default MCP9808;