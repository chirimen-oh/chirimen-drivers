// @ts-check

/**
 * @typedef {0x70 | 0x71 | 0x72 | 0x73 | 0x74 | 0x75 | 0x76 | 0x77} TCA9548AAddress
 * I2C bus slave address (default `0x70`; when A0-A2 pins are high(1)/low(0) `0x70+4*A2+2*A1+A0`)
 */

/**
 * @typedef {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7} TCA9548AChannel
 * 8 switch channels for I2C data flow
 */

/**
 * @type {ReadonlyArray<TCA9548AChannel>}
 */
export const TCA9548AChannels = [0, 1, 2, 3, 4, 5, 6, 7];

export class TCA9548ANotFoundError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * @param {import("node-web-i2c").I2CPort} bus
 * @param {TCA9548AAddress} [address=0x70]
 * @returns {{
 *   i2cSlave: import("node-web-i2c").I2CSlaveDevice | null,
 *   init: () => Promise<void>,
 *   read: () => Promise<TCA9548AChannel | null>,
 *   write: (channel?: TCA9548AChannel) => Promise<void>
 * }}
 */
export function TCA9548A(bus, address = 0x70) {
  return {
    i2cSlave: null,
    async init() {
      this.i2cSlave = await bus.open(address);
    },
    async read() {
      try {
        if (this.i2cSlave == null) await this.init();
        if (this.i2cSlave == null) throw "internal error";
      } catch (error) {
        throw new TCA9548ANotFoundError(error.stack || error);
      }
      const index = TCA9548AChannels.map((channel) => 1 << channel).indexOf(
        await this.i2cSlave.readByte(),
      );
      return index in TCA9548AChannels ? TCA9548AChannels[index] : null;
    },
    async write(channel = 0) {
      try {
        if (this.i2cSlave == null) await this.init();
        if (this.i2cSlave == null) throw "internal error";
      } catch (error) {
        throw new TCA9548ANotFoundError(error.stack || error);
      }
      await this.i2cSlave.writeByte(1 << channel);
    },
  };
}

export default TCA9548A;
