// @ts-check

// DRV2605L driver for CHIRIMEN
// Haptic Motor Driver

const DEFAULT_SLAVE_ADDRESS = 0x5a;
const DEFAULT_OVERDRIVE_CLAMP = 0x8c;

// DRV2605L registers
const REG_MODE = 0x01;
const REG_RTP_INPUT = 0x02;
const REG_LIBRARY = 0x03;
const REG_WAVESEQ1 = 0x04;
const REG_WAVESEQ2 = 0x05;
const REG_GO = 0x0c;
const REG_OVERDRIVE_TIME_OFFSET = 0x0d;
const REG_SUSTAIN_TIME_OFFSET_POS = 0x0e;
const REG_SUSTAIN_TIME_OFFSET_NEG = 0x0f;
const REG_BRAKE_TIME_OFFSET = 0x10;
const REG_OVERDRIVE_CLAMP = 0x17;
const REG_FEEDBACK_CONTROL = 0x1a;
const REG_CONTROL3 = 0x1d;

// Operation modes
const MODE_INTERNAL_TRIGGER = 0x00;
const MODE_REAL_TIME_PLAYBACK = 0x05;

// ERM effect library
const LIBRARY_ERM_A = 0x01;

const GO = 0x01;
const STOP = 0x00;

class DRV2605L {
  /**
   * @constructor
   * @param {import('node-web-i2c').I2CPort} i2cPort I2C port instance
   * @param {number} [slaveAddress] I2C slave address
   */
  constructor(i2cPort, slaveAddress) {
    if (slaveAddress === undefined) {
      slaveAddress = DEFAULT_SLAVE_ADDRESS;
    }

    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;
    this.operationId = 0;
  }

  /**
   * Initialize DRV2605L for an ERM vibration motor.
   */
  async init() {
    if (this.i2cSlave) {
      return;
    }
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);

    // Internal trigger mode
    await this.i2cSlave.write8(REG_MODE, MODE_INTERNAL_TRIGGER);

    // Disable RTP input
    await this.i2cSlave.write8(REG_RTP_INPUT, 0x00);

    // Select ERM effect library
    await this.i2cSlave.write8(REG_LIBRARY, LIBRARY_ERM_A);

    // Clear waveform sequence
    await this.i2cSlave.write8(REG_WAVESEQ1, 0x00);

    await this.i2cSlave.write8(REG_WAVESEQ2, 0x00);

    // Reset timing offsets
    await this.i2cSlave.write8(REG_OVERDRIVE_TIME_OFFSET, 0x00);

    await this.i2cSlave.write8(REG_SUSTAIN_TIME_OFFSET_POS, 0x00);

    await this.i2cSlave.write8(REG_SUSTAIN_TIME_OFFSET_NEG, 0x00);

    await this.i2cSlave.write8(REG_BRAKE_TIME_OFFSET, 0x00);

    // Set the full-scale voltage reference for ERM open-loop operation.
    // 0x8C corresponds to approximately 3.02 V.
    await this.i2cSlave.write8(REG_OVERDRIVE_CLAMP, DEFAULT_OVERDRIVE_CLAMP);

    // Select ERM mode
    let feedback = await this.i2cSlave.read8(REG_FEEDBACK_CONTROL);

    feedback &= 0x7f;

    await this.i2cSlave.write8(REG_FEEDBACK_CONTROL, feedback);

    // ERM open-loop mode
    let control3 = await this.i2cSlave.read8(REG_CONTROL3);

    control3 |= 0x20;

    await this.i2cSlave.write8(REG_CONTROL3, control3);
  }

  /**
   * Play a built-in waveform effect.
   *
   * @param {number} effect Effect number (1-123)
   */
  async playEffect(effect = 1) {
    if (!this.i2cSlave) {
      throw new Error("DRV2605L is not initialized");
    }

    const operationId = ++this.operationId;

    if (!Number.isInteger(effect) || effect < 1 || effect > 123) {
      throw new RangeError("effect must be an integer from 1 to 123");
    }

    // Return to internal trigger mode
    await this.i2cSlave.write8(REG_MODE, MODE_INTERNAL_TRIGGER);

    // Select effect
    await this.i2cSlave.write8(REG_WAVESEQ1, effect);

    // End waveform sequence
    await this.i2cSlave.write8(REG_WAVESEQ2, 0x00);

    // Start playback
    await this.i2cSlave.write8(REG_GO, GO);

    // Wait until playback completes.
    while ((await this.i2cSlave.read8(REG_GO)) & GO) {
      if (operationId !== this.operationId) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  /**
   * Vibrate using Real-Time Playback mode.
   *
   * @param {number} strength Vibration strength (0-127)
   * @param {number} duration Duration in milliseconds
   */
  async vibrate(strength = 100, duration = 200) {
    if (!this.i2cSlave) {
      throw new Error("DRV2605L is not initialized");
    }

    if (!Number.isInteger(strength) || strength < 0 || strength > 127) {
      throw new RangeError("strength must be an integer from 0 to 127");
    }

    if (!Number.isInteger(duration) || duration < 0) {
      throw new RangeError("duration must be a positive integer");
    }

    const operationId = ++this.operationId;

    // Change to Real-Time Playback mode
    await this.i2cSlave.write8(REG_MODE, MODE_REAL_TIME_PLAYBACK);

    // Start vibration
    await this.i2cSlave.write8(REG_RTP_INPUT, strength);
    // Keep vibrating for the specified duration
    await new Promise((resolve) => setTimeout(resolve, duration));

    // Another operation may have started while waiting.
    // In that case, do not overwrite its state.
    if (operationId !== this.operationId) {
      return;
    }

    // Stop vibration
    await this.i2cSlave.write8(REG_RTP_INPUT, 0x00);

    // Return to internal trigger mode
    await this.i2cSlave.write8(REG_MODE, MODE_INTERNAL_TRIGGER);
  }

  /**
   * Stop vibration.
   */
  async stop() {
    if (!this.i2cSlave) {
      throw new Error("DRV2605L is not initialized");
    }

    this.operationId++;

    // Stop waveform playback
    await this.i2cSlave.write8(REG_GO, STOP);

    // Stop RTP vibration
    await this.i2cSlave.write8(REG_RTP_INPUT, 0x00);

    // Return to internal trigger mode
    await this.i2cSlave.write8(REG_MODE, MODE_INTERNAL_TRIGGER);
  }
}

export default DRV2605L;
