// @ts-check

// TMP117 driver for CHIRIMEN
// Based from https://www.ti.com/lit/ds/symlink/tmp117.pdf

const TEMP_RESULT_REGISTER = 0x00;
const DEVICE_ID_REGISTER = 0x0f;
const EXPECTED_DEVICE_ID_MASK = 0x0fff; // lower 12 bits are DID; upper 4 bits are silicon revision
const EXPECTED_DEVICE_ID = 0x0117;
const TEMP_RESOLUTION = 0.0078125; // °C per LSB

const GENERAL_CALL_ADDRESS = 0x00;
const GENERAL_CALL_RESET_DATA = 0x06;
const RESET_WAIT_MS = 20;

class TMP117 {
  /**
   * @constructor
   * @param {import('node-web-i2c').I2CPort} i2cPort I2C port instance
   * @param {number} [slaveAddress] I2C slave address (default: 0x48)
   */
  constructor(i2cPort, slaveAddress = 0x48) {
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;
  }

  async init() {
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
    await this.reset();
    await this.#checkDeviceId();
    return this;
  }

  async #checkDeviceId() {
    const deviceId = await this.#readRegister16(DEVICE_ID_REGISTER);
    if ((deviceId & EXPECTED_DEVICE_ID_MASK) !== EXPECTED_DEVICE_ID) {
      throw new Error(
        `Unexpected device ID: 0x${deviceId.toString(16)} (expected 0x0117)`,
      );
    }
  }

  /**
   * Performs a software reset via I2C's General Call Reset mechanism.
   * Called automatically during init().
   *
   * WARNING: General Call Reset is a bus-wide broadcast, not a
   * TMP117-specific command. It will also reset ANY other I2C device
   * on the same bus that responds to General Call Reset (e.g. other
   * TI sensors) - not just this TMP117 instance. Avoid calling this
   * if other General-Call-capable devices are sharing the bus and
   * should not be reset.
   */
  async reset() {
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
