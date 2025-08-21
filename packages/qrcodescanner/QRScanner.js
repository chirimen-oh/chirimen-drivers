// Driver for the QR Code Scanner Unit
// based from https://github.com/m5stack/M5Unit-QRCode/blob/main/src/M5UnitQRCodeI2C.cpp
// Programmed by Ryoma Aoki

const qrscanner_QRCODE_ADDR = 0x21;
const qrscanner_QRCODE_TRIGGER_REG = 0x0000;
const qrscanner_QRCODE_READY_REG = 0x0010;
const qrscanner_QRCODE_LENGTH_REG = 0x0020;
const qrscanner_QRCODE_TRIGGER_MODE_REG = 0x0030;
const qrscanner_QRCODE_TRIGGER_KEY_REG = 0x0040;
const qrscanner_QRCODE_DATA_REG = 0x1000;
const JUMP_TO_BOOTLOADER_REG = 0x00fd;
const FIRMWARE_VERSION_REG = 0x00fe;

class QRScanner {
  constructor(i2cPort, slaveAddress) {
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;
  }

  async init() {
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
  }

  async _write(reg16, data) {
    let sendData = [];
    sendData[0] = reg16 & 0x00ff;
    sendData[1] = (reg16 >> 8) & 0x00ff;
    const sendArray = sendData.concat(data);
    return await this.i2cSlave.writeBytes(sendArray);
  }

  async _read(reg16, length) {
    let sendData = [];
    sendData[0] = reg16 & 0x00ff;
    sendData[1] = (reg16 >> 8) & 0x00ff;
    await this.i2cSlave.writeBytes(sendData);
    return await this.i2cSlave.readBytes(length);
  }

  async setTriggerMode(mode) {
    await this._write(qrscanner_QRCODE_TRIGGER_MODE_REG, [mode]);
  }
  async getTriggerMode() {
    const modeArr = await this._read(qrscanner_QRCODE_TRIGGER_MODE_REG, 1);
    return modeArr[0];
  }

  async getDecodeReadyStatus() {
    const statusArr = await this._read(qrscanner_QRCODE_READY_REG, 1);
    return statusArr[0];
  }

  async getDecodeLength() {
    const data = await this._read(qrscanner_QRCODE_LENGTH_REG, 2);
    return (data[1] << 8) | data[0];
  }

  async getDecodeData(length) {
    const data = await this._read(qrscanner_QRCODE_DATA_REG, length);
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(Uint8Array.from(data));
  }

  wait(ms) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, ms);
    });
  }

  async scanData() {
    for (;;) {
      let status = await this.getDecodeReadyStatus();
      if (status == 1 || status == 2) {
        const length = await this.getDecodeLength();
        if (length > 0) {
          const data = await this.getDecodeData(length);
          return data;
        }
      }
      await this.wait(10);
    }
  }
}

export default QRScanner;
