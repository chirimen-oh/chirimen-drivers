// @ts-check

const REG_INTR_STATUS_1 = 0x00;
const REG_INTR_STATUS_2 = 0x01;
const REG_INTR_ENABLE_1 = 0x02;
const REG_INTR_ENABLE_2 = 0x03;
const REG_FIFO_WR_PTR = 0x04;
const REG_OVF_COUNTER = 0x05;
const REG_FIFO_RD_PTR = 0x06;
const REG_FIFO_DATA = 0x07;
const REG_FIFO_CONFIG = 0x08;
const REG_MODE_CONFIG = 0x09;
const REG_SPO2_CONFIG = 0x0a;
const REG_LED1_PA = 0x0c;
const REG_LED2_PA = 0x0d;
const REG_PILOT_PA = 0x10;

/**
 * MAX30102センサードライバー
 */
export class MAX30102 {
  /** @type {import('node-web-i2c').I2CSlaveDevice | null} */
  #device = null;

  /**
   * @param {import('node-web-i2c').I2CPort} port I2Cポート
   * @param {number} [address=0x57] I2Cアドレス(デフォルト: 0x57)
   */
  constructor(port, address = 0x57) {
    this.port = port;
    this.address = address;
  }

  /**
   * 初期化・設定
   * @returns {Promise<void>}
   */
  async init() {
    this.#device = await this.port.open(this.address);
    await this.reset();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await this.#device.read8(REG_INTR_STATUS_1);
    await this.setup();
  }

  /**
   * センサーのリセット
   * @returns {Promise<void>}
   */
  async reset() {
    if (!this.#device) throw new Error("Device not initialized");
    await this.#device.write8(REG_MODE_CONFIG, 0x40);
  }

  /**
   * センサーのシャットダウン
   * @returns {Promise<void>}
   */
  async shutdown() {
    if (!this.#device) throw new Error("Device not initialized");
    await this.#device.write8(REG_MODE_CONFIG, 0x80);
  }

  /**
   * センサーの設定
   * @param {number} [ledMode=0x03] LEDモード (0x02: 読み取り専用, 0x03: SpO2モード, 0x07: マルチモードLED)
   * @returns {Promise<void>}
   */
  async setup(ledMode = 0x03) {
    if (!this.#device) throw new Error("Device not initialized");

    await this.#device.write8(REG_INTR_ENABLE_1, 0xc0);
    await this.#device.write8(REG_INTR_ENABLE_2, 0x00);

    await this.#device.write8(REG_FIFO_WR_PTR, 0x00);
    await this.#device.write8(REG_OVF_COUNTER, 0x00);
    await this.#device.write8(REG_FIFO_RD_PTR, 0x00);

    await this.#device.write8(REG_FIFO_CONFIG, 0x4f);

    await this.#device.write8(REG_MODE_CONFIG, ledMode);
    await this.#device.write8(REG_SPO2_CONFIG, 0x27);

    await this.#device.write8(REG_LED1_PA, 0x24);
    await this.#device.write8(REG_LED2_PA, 0x24);
    await this.#device.write8(REG_PILOT_PA, 0x7f);
  }

  /**
   * 未読み出しサイズ(読み取り位置と書き込み位置の差分)を取得 (最大32)
   * @returns {Promise<number>}
   */
  async available() {
    if (!this.#device) throw new Error("Device not initialized");

    const overflow = await this.#device.read8(REG_OVF_COUNTER);

    if (overflow > 0) return 32; // FIFO buffer size

    const readPtr = await this.#device.read8(REG_FIFO_RD_PTR);
    const writePtr = await this.#device.read8(REG_FIFO_WR_PTR);

    return 0x1f & (writePtr - readPtr);
  }

  /**
   * 赤外線・赤色光を1回読み取る
   * @returns {Promise<{ir: number, red: number}>}
   */
  async readSample() {
    if (!this.#device) throw new Error("Device not initialized");

    await this.#device.read8(REG_INTR_STATUS_1);
    await this.#device.read8(REG_INTR_STATUS_2);

    await this.#device.writeByte(REG_FIFO_DATA);
    const data = await this.#device.readBytes(6);

    const red = ((data[0] << 16) | (data[1] << 8) | data[2]) & 0x03ffff;
    const ir = ((data[3] << 16) | (data[4] << 8) | data[5]) & 0x03ffff;

    return { ir, red };
  }

  /**
   * 赤外線・赤色光を読み取る (サンプリングレート: 約 25 Hz)
   * @param {number} [samples=250] 読み取り回数 (デフォルト: 250 回 ≒ 10 秒)
   * @returns {AsyncGenerator<{ir: number, red: number}>}
   */
  async *readSamples(samples = 250) {
    while (0 < samples) {
      for (
        let bytes = await this.available();
        0 < samples && 0 < bytes;
        samples--, bytes--
      ) {
        yield await this.readSample();
      }
    }
  }

  /**
   * 移動平均除去AC成分を計算
   * @param {number[]} values 入力値配列
   * @param {number} [windowSize=25] 窓サイズ (デフォルト: 25 ≒ 1秒)
   * @returns {number[]} AC成分の配列
   */
  #calculateAcValues(values, windowSize = 25) {
    /** @type {number[]} */
    const acValues = [];

    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(values.length, i + Math.floor(windowSize / 2) + 1);
      const sum = values.slice(start, end).reduce((acc, val) => acc + val, 0);
      const average = sum / (end - start);

      acValues.push(values[i] - average);
    }

    return acValues;
  }

  /**
   * ピーク検出
   * @param {number[]} values AC成分配列
   * @param {number} [minDistance=12] 最小ピーク間隔 (デフォルト: 12 ≒ 0.5秒)
   * @returns {number[]} ピークのインデックス配列
   */
  #detectPeaks(values, minDistance = 12) {
    /** @type {number[]} */
    const peaks = [];

    for (let i = 1; i < values.length - 1; i++) {
      if (
        values[i] > values[i - 1] &&
        values[i] > values[i + 1] &&
        values[i] > 0
      ) {
        if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDistance) {
          peaks.push(i);
        }
      }
    }

    return peaks;
  }

  /**
   * 脈拍検出
   * @param {number[]} values 入力値配列
   * @param {number} [samplingRate=25] サンプリングレート (デフォルト: 25 Hz)
   * @returns {number | null} 脈拍数 (BPM)、検出できない場合はnull
   */
  detectHeartRate(values, samplingRate = 25) {
    const minBPM = (2 * samplingRate * 60) / values.length;
    const maxBPM = 120;
    const acValues = this.#calculateAcValues(values);
    const peaks = this.#detectPeaks(acValues);

    if (peaks.length < 2) {
      return null;
    }

    /** @type {number[]} */
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }

    // Remove outliers based on median
    const sorted = [...intervals].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const filtered = intervals.filter(
      (v) => v > median * 0.7 && v < median * 1.3,
    );

    // Fall back to null if all intervals are filtered out
    if (filtered.length === 0) {
      return null;
    }

    const averageInterval =
      filtered.reduce((acc, val) => acc + val, 0) / filtered.length;

    const heartRate = Math.round((samplingRate * 60) / averageInterval);

    if (minBPM <= heartRate && heartRate < maxBPM) {
      return heartRate;
    } else {
      return null;
    }
  }

  /**
   * 脈拍を読み取る
   * @returns {Promise<{heartRate: number | null}>}
   */
  async read() {
    /** @type {Array<{ir: number, red: number}>} */
    const values = [];

    for await (const value of this.readSamples()) {
      values.push(value);
    }

    const irValues = values.map((sample) => sample.ir);

    const heartRate = this.detectHeartRate(irValues);

    return { heartRate };
  }
}

export default MAX30102;
