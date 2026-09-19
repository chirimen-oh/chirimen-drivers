// @ts-check

// DRV8830 driver for CHIRIMEN
// Reference: https://www.ti.com/lit/ds/symlink/drv8830.pdf

const DEFAULT_SLAVE_ADDRESS = 0x64;

// DRV8830 registers
const REG_CONTROL = 0x00;
const REG_FAULT = 0x01;

// IN1/IN2 bits in the CONTROL register (bit1: IN2, bit0: IN1)
const CONTROL_STANDBY = 0x00; // IN1=0, IN2=0: Standby / coast (Hi-Z)
const CONTROL_FORWARD = 0x01; // IN1=1, IN2=0: Forward
const CONTROL_REVERSE = 0x02; // IN1=0, IN2=1: Reverse
const CONTROL_BRAKE = 0x03; // IN1=1, IN2=1: Brake

// FAULT register bits
const FAULT_CLEAR = 0x80;
const FAULT_ILIMIT = 0x10;
const FAULT_OTS = 0x08;
const FAULT_UVLO = 0x04;
const FAULT_OCP = 0x02;
const FAULT_FAULT = 0x01;

// Internal VSET DAC reference voltage (typical, per datasheet)
const VREF = 1.285;

// Output voltage per VSET LSB: VOUT = VSET * 4 * VREF / 64
const VSET_STEP = (4 * VREF) / 64;

// VSET is a 6-bit field (0-63)
const VSET_MAX = 0x3f;

class DRV8830 {
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
  }

  /**
   * Open the I2C connection to the DRV8830.
   */
  async init() {
    if (this.i2cSlave) {
      return;
    }

    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
  }

  /**
   * Drive the motor forward at the given output voltage.
   *
   * @param {number} voltage Output voltage (0-5.06)
   */
  async forward(voltage = 3) {
    await this.drive(voltage, CONTROL_FORWARD);
  }

  /**
   * Drive the motor in reverse at the given output voltage.
   *
   * @param {number} voltage Output voltage (0-5.06)
   */
  async reverse(voltage = 3) {
    await this.drive(voltage, CONTROL_REVERSE);
  }

  /**
   * Short-brake the motor (both outputs driven high).
   */
  async brake() {
    if (!this.i2cSlave) {
      throw new Error("DRV8830 is not initialized");
    }

    await this.i2cSlave.write8(REG_CONTROL, CONTROL_BRAKE);
  }

  /**
   * Stop driving the motor (coast / high-impedance outputs).
   */
  async stop() {
    if (!this.i2cSlave) {
      throw new Error("DRV8830 is not initialized");
    }

    await this.i2cSlave.write8(REG_CONTROL, CONTROL_STANDBY);
  }

  /**
   * @param {number} voltage
   * @param {number} direction CONTROL_FORWARD or CONTROL_REVERSE
   */
  async drive(voltage, direction) {
    if (!this.i2cSlave) {
      throw new Error("DRV8830 is not initialized");
    }

    if (
      typeof voltage !== "number" ||
      !Number.isFinite(voltage) ||
      voltage < 0
    ) {
      throw new RangeError("voltage must be a non-negative number");
    }

    // Values above the maximum output voltage are clamped to VSET_MAX.
    const vset = Math.min(VSET_MAX, Math.round(voltage / VSET_STEP));

    await this.i2cSlave.write8(REG_CONTROL, (vset << 2) | direction);
  }

  /**
   * Read the FAULT register.
   *
   * @returns {Promise<{fault: boolean, ocp: boolean, uvlo: boolean, ots: boolean, ilimit: boolean}>}
   */
  async readFault() {
    if (!this.i2cSlave) {
      throw new Error("DRV8830 is not initialized");
    }

    const value = await this.i2cSlave.read8(REG_FAULT);

    return {
      fault: (value & FAULT_FAULT) !== 0,
      ocp: (value & FAULT_OCP) !== 0,
      uvlo: (value & FAULT_UVLO) !== 0,
      ots: (value & FAULT_OTS) !== 0,
      ilimit: (value & FAULT_ILIMIT) !== 0,
    };
  }

  /**
   * Clear the FAULT register.
   */
  async clearFault() {
    if (!this.i2cSlave) {
      throw new Error("DRV8830 is not initialized");
    }

    await this.i2cSlave.write8(REG_FAULT, FAULT_CLEAR);
  }

  // @ts-ignore
  async [Symbol.asyncDispose]() {
    await this.stop();
    await this.clearFault();
  }
}

export default DRV8830;
