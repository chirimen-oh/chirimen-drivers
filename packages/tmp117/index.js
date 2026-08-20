// @ts-check

// TMP117 driver for CHIRIMEN
// Based from https://www.ti.com/lit/ds/symlink/tmp117.pdf

const TEMP_RESULT_REGISTER = 0x00;
const CONFIG_REGISTER = 0x01;
const DEVICE_ID_REGISTER = 0x0f;
const EXPECTED_DEVICE_ID = 0x0117;
const TEMP_RESOLUTION = 0.0078125; // °C per LSB

const GENERAL_CALL_ADDRESS = 0x00;
const GENERAL_CALL_RESET_DATA = 0x06;
const RESET_WAIT_MS = 20;

const MODE_CONTINUOUS = 0b00;
const MODE_SHUTDOWN = 0b01;
const MODE_ONESHOT = 0b11;
const MODE_MASK = 0b0000110000000000;
const MODE_SHIFT = 10;

class TMP117 {
  /**
   * @constructor
   * @param {import('node-web-i2c').I2CPort} i2cPort I2C port instance
   * @param {number} slaveAddress I2C slave address
   */
  constructor(i2cPort, slaveAddress) {
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;
    this.mode = MODE_CONTINUOUS;
  }

  async init() {
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
    await this.#checkDeviceId();
    return this;
  }

  async #checkDeviceId() {
    const deviceId = await this.#readRegister16(DEVICE_ID_REGISTER);
    if (deviceId !== EXPECTED_DEVICE_ID) {
      throw new Error(
        `Unexpected device ID: 0x${deviceId.toString(16)} (expected 0x0117)`,
      );
    }
  }

  async #reset() {
    const generalCallSlave = await this.i2cPort.open(GENERAL_CALL_ADDRESS);
    await generalCallSlave.writeByte(GENERAL_CALL_RESET_DATA);
    await this.#wait(RESET_WAIT_MS);
  }

  #wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  #swapBytes(value) {
    return ((value & 0xff) << 8) | (value >> 8);
  }

  async #readRegister16(register) {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }
    const rawValue = await this.i2cSlave.read16(register);
    return this.#swapBytes(rawValue);
  }

  async #writeRegister16(register, value) {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }
    await this.i2cSlave.write16(register, this.#swapBytes(value));
  }

  /**
   * @param {number} mode
   */
  async setMode(mode) {
    if (
      mode !== MODE_CONTINUOUS &&
      mode !== MODE_SHUTDOWN &&
      mode !== MODE_ONESHOT
    ) {
      throw new Error("TMP117.setMode() invalid mode!");
    }
    this.mode = mode;
    let config = await this.#readRegister16(CONFIG_REGISTER);
    config = config & ~MODE_MASK;
    config |= mode << MODE_SHIFT;
    await this.#writeRegister16(CONFIG_REGISTER, config);
    return mode;
  }

  async read() {
    const signedRawValue = await this.#readRegister16(TEMP_RESULT_REGISTER);
    const signedValue =
      signedRawValue > 0x7fff ? signedRawValue - 0x10000 : signedRawValue;
    const rawTemperature = signedValue * TEMP_RESOLUTION;
    const temperature = Math.round(rawTemperature * 100) / 100;
    return { temperature };
  }
}

export default TMP117;
