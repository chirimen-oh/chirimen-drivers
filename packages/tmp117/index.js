// @ts-check

// TMP117 driver for CHIRIMEN
// Based from https://www.ti.com/lit/ds/symlink/tmp117.pdf
// Programmed by Jasmine Ortiz

const TEMP_RESULT_REGISTER = 0x00;
const CONFIG_REGISTER = 0x01;
const DEVICE_ID_REGISTER = 0x0f;
const EXPECTED_DEVICE_ID_MASK = 0x0fff; // lower 12 bits are DID; upper 4 bits are silicon revision
const EXPECTED_DEVICE_ID = 0x0117;
const TEMP_RESOLUTION = 0.0078125; // °C per LSB

// bit1 of the CONFIGURATION register: writing 1 here triggers a
// software reset of only THIS device (a normal addressed I2C write),
// unlike the I2C General Call Reset which broadcasts to every device
// on the bus. The bit self-clears once the reset completes.
const CONFIG_SOFT_RESET_BIT = 0b0000000000000010;
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
        `Unexpected device ID: 0x${deviceId.toString(16)} (expected 0x${EXPECTED_DEVICE_ID.toString(16)})`,
      );
    }
  }
  /**
   * Performs a software reset of this TMP117 instance only, by writing
   * the Soft_Reset bit in its own CONFIGURATION register. Because this
   * is an ordinary addressed I2C write (to this.slaveAddress), only
   * this device receives it - other devices sharing the bus are not
   * affected.
   *
   * Called automatically during init().
   */
  async reset() {
    await this.#writeRegister16(CONFIG_REGISTER, CONFIG_SOFT_RESET_BIT);
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
