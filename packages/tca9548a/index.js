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
 * @typedef {Pick<import("node-web-i2c").I2CPort, "portNumber" | "portName" | "open">} TCA9548AChannelPort
 * An I2CPort-shaped object bound to a single downstream channel. It's
 * structurally compatible with I2CPort, but not an instance of it (I2CPort
 * is a class with a private field, which a plain object can never satisfy).
 */

/**
 * @type {ReadonlyArray<TCA9548AChannel>}
 */
export const TCA9548AChannels = [0, 1, 2, 3, 4, 5, 6, 7];

/**
 * @param {number} value
 * @returns {value is TCA9548AChannel}
 */
function isTCA9548AChannel(value) {
  return TCA9548AChannels.includes(/** @type {TCA9548AChannel} */ (value));
}

/**
 * @param {number} channel
 * @returns {asserts channel is TCA9548AChannel}
 */
function assertTCA9548AChannel(channel) {
  if (!isTCA9548AChannel(channel)) {
    throw new RangeError(
      `Invalid TCA9548A channel: ${channel}. Must be one of ${TCA9548AChannels.join(", ")}.`,
    );
  }
}

export class TCA9548ANotFoundError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class TCA9548ALockTimeoutError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

const LOCK_TIMEOUT_MS = 5000;

export class TCA9548A {
  /** @type {import("node-web-i2c").I2CPort} */
  #bus;
  /** @type {TCA9548AAddress} */
  #address;

  // Serializes channel switches with the I2C transaction that follows them,
  // so that devices behind different channels (accessed via `get()`) don't
  // interleave and stomp on each other's channel selection. Tasks passed to
  // #withLock must only call the private #read/#write, never the public
  // read()/write() or a get()-wrapped method, or the queue deadlocks.
  /** @type {Promise<any>} */
  #queue = Promise.resolve();

  /** @type {Map<TCA9548AChannel, TCA9548AChannelPort>} */
  #ports = new Map();

  /** @type {import("node-web-i2c").I2CSlaveDevice | null} */
  i2cSlave = null;

  /**
   * @param {import("node-web-i2c").I2CPort} bus
   * @param {TCA9548AAddress} [address=0x70]
   */
  constructor(bus, address = 0x70) {
    this.#bus = bus;
    this.#address = address;
  }

  /** @returns {Promise<void>} */
  async init() {
    this.i2cSlave = await this.#bus.open(this.#address);
  }

  /** @returns {Promise<import("node-web-i2c").I2CSlaveDevice>} */
  async #ensureSlave() {
    try {
      if (this.i2cSlave == null) await this.init();
      if (this.i2cSlave == null) throw new Error("internal error");
    } catch (error) {
      throw new TCA9548ANotFoundError(
        error instanceof Error ? (error.stack ?? error.message) : String(error),
      );
    }
    return this.i2cSlave;
  }

  /**
   * @template T
   * @param {() => Promise<T>} task
   * @returns {Promise<T>}
   */
  #withLock(task) {
    // `settled` tracks the real task to completion, however long that
    // takes, and #queue only ever advances once it does — later calls
    // must never start while an earlier one might still be mid-transaction
    // on the shared bus, or they could interleave with it. The timeout
    // below only bounds how long *this* caller waits for a response; it
    // does not release the queue early, since we have no way to cancel
    // the underlying I2C operation once issued.
    const settled = this.#queue.then(task, task);
    this.#queue = settled.then(
      () => {},
      () => {},
    );
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new TCA9548ALockTimeoutError(
            `TCA9548A I2C operation timed out after ${LOCK_TIMEOUT_MS}ms`,
          ),
        );
      }, LOCK_TIMEOUT_MS);
      settled.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        },
      );
    });
  }

  async #read() {
    const slave = await this.#ensureSlave();
    const channel = Math.log2(await slave.readByte());
    return isTCA9548AChannel(channel) ? channel : null;
  }

  /** @param {TCA9548AChannel} [channel=0] */
  async #write(channel = 0) {
    assertTCA9548AChannel(channel);
    const slave = await this.#ensureSlave();
    await slave.writeByte(1 << channel);
  }

  /** @returns {Promise<TCA9548AChannel | null>} */
  async read() {
    return this.#withLock(() => this.#read());
  }

  /** @param {TCA9548AChannel} [channel=0] */
  async write(channel = 0) {
    return this.#withLock(() => this.#write(channel));
  }

  /**
   * @param {TCA9548AChannel} channel
   * @param {(...args: any[]) => Promise<any>} method
   * @returns {(...args: any[]) => Promise<any>}
   */
  #wrapMethod(channel, method) {
    return (...args) =>
      this.#withLock(async () => {
        await this.#write(channel);
        return await method(...args);
      });
  }

  /**
   * Returns an I2CPort-like object bound to a single downstream channel,
   * so drivers behind the mux can be used exactly like a plain I2CPort
   * (e.g. `new SHT30(mux.get(0))`), without manually switching channels.
   * @param {TCA9548AChannel} channel
   * @returns {TCA9548AChannelPort}
   */
  get(channel) {
    assertTCA9548AChannel(channel);
    const cached = this.#ports.get(channel);
    if (cached != null) return cached;

    const bus = this.#bus;
    /** @type {TCA9548AChannelPort} */
    const port = {
      portNumber: bus.portNumber,
      portName: bus.portName,
      open: async (slaveAddress) => {
        const slave = await bus.open(slaveAddress);
        return {
          slaveAddress,
          read8: this.#wrapMethod(channel, slave.read8.bind(slave)),
          read16: this.#wrapMethod(channel, slave.read16.bind(slave)),
          write8: this.#wrapMethod(channel, slave.write8.bind(slave)),
          write16: this.#wrapMethod(channel, slave.write16.bind(slave)),
          readByte: this.#wrapMethod(channel, slave.readByte.bind(slave)),
          readBytes: this.#wrapMethod(channel, slave.readBytes.bind(slave)),
          writeByte: this.#wrapMethod(channel, slave.writeByte.bind(slave)),
          writeBytes: this.#wrapMethod(channel, slave.writeBytes.bind(slave)),
        };
      },
    };
    this.#ports.set(channel, port);
    return port;
  }
}

export default TCA9548A;
