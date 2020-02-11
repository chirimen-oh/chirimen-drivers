import { I2CPort, I2CSlaveDevice } from "node-web-i2c";

/** I2C bus slave address (default `0x70`; when A0-A2 pins are high(1)/low(0) `0x70+4*A2+2*A1+A0` ) */
export type TCA9548AAddress =
  | 0x70
  | 0x71
  | 0x72
  | 0x73
  | 0x74
  | 0x75
  | 0x76
  | 0x77;

/** 8 switch channels for I2C data flow */
export type TCA9548AChannel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const TCA9548AChannels: ReadonlyArray<TCA9548AChannel> = [
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7
];

export class TCA9548ANotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
export function TCA9548A(bus: I2CPort, address: TCA9548AAddress = 0x70) {
  return {
    i2cSlave: null as I2CSlaveDevice | null,
    async init() {
      this.i2cSlave = await bus.open(address);
    },
    async read(): Promise<TCA9548AChannel | null> {
      try {
        if (this.i2cSlave == null) await this.init();
        if (this.i2cSlave == null) throw "internal error";
      } catch (error) {
        throw new TCA9548ANotFoundError(error.stack || error);
      }
      const index = TCA9548AChannels.map(channel => 1 << channel).indexOf(
        await this.i2cSlave.readByte()
      );
      return index in TCA9548AChannels ? TCA9548AChannels[index] : null;
    },
    async write(channel: TCA9548AChannel = 0) {
      try {
        if (this.i2cSlave == null) await this.init();
        if (this.i2cSlave == null) throw "internal error";
      } catch (error) {
        throw new TCA9548ANotFoundError(error.stack || error);
      }
      await this.i2cSlave.writeByte(1 << channel);
    }
  };
}

export default TCA9548A;
