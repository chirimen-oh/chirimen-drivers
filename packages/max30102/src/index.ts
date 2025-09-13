import type { I2CPort, I2CSlaveDevice } from "node-web-i2c";

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

export class MAX30102 {
  #device: I2CSlaveDevice | null = null;

  /**
   * @param port I2Cポート
   * @param address I2Cアドレス(デフォルト: 0x57)
   */
  constructor(public port: I2CPort, public address = 0x57) {}

  /**
   * 初期化・設定
   */
  async init(): Promise<void> {
    this.#device = await this.port.open(this.address);
    await this.reset();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await this.#device.read8(REG_INTR_STATUS_1);
    await this.setup();
  }

  /**
   * センサーのリセット
   */
  async reset(): Promise<void> {
    if (!this.#device) throw new Error("Device not initialized");
    await this.#device.write8(REG_MODE_CONFIG, 0x40);
  }

  /**
   * センサーのシャットダウン
   */
  async shutdown(): Promise<void> {
    if (!this.#device) throw new Error("Device not initialized");
    await this.#device.write8(REG_MODE_CONFIG, 0x80);
  }

  /**
   * センサーの設定
   * @param ledMode LEDモード (0x02: 読み取り専用, 0x03: SpO2モード, 0x07: マルチモードLED)
   */
  async setup(ledMode = 0x03): Promise<void> {
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
   */
  async available(): Promise<number> {
    if (!this.#device) throw new Error("Device not initialized");

    const readPtr = await this.#device.read8(REG_FIFO_RD_PTR);
    const writePtr = await this.#device.read8(REG_FIFO_WR_PTR);

    return 0x1f & (writePtr - readPtr);
  }

  /**
   * 赤外線・赤色光を1回読み取る
   */
  async readSample(): Promise<{ ir: number; red: number }> {
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
   * @param samples 読み取り回数 (デフォルト: 250 回 ≒ 10 秒)
   */
  async *readSamples(
    samples = 250,
  ): AsyncGenerator<{ ir: number; red: number }> {
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
   * @param values 入力値配列
   * @param windowSize 窓サイズ (デフォルト: 25 ≒ 1秒)
   * @returns AC成分の配列
   */
  #calculateAcValues(values: number[], windowSize = 25): number[] {
    const acValues: number[] = [];

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
   * @param values AC成分配列
   * @param minDistance 最小ピーク間隔 (デフォルト: 12 ≒ 0.5秒)
   * @returns ピークのインデックス配列
   */
  #detectPeaks(values: number[], minDistance = 12): number[] {
    const peaks: number[] = [];

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
   */
  detectHeartRate(values: number[], samplingRate = 25): number | null {
    const minBPM = (2 * samplingRate * 60) / values.length;
    const maxBPM = 120;
    const acValues = this.#calculateAcValues(values);
    const peaks = this.#detectPeaks(acValues);

    if (peaks.length < 2) {
      return null;
    }

    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }

    const averageInterval =
      intervals.reduce((acc, val) => acc + val, 0) / intervals.length;

    const heartRate = Math.round((samplingRate * 60) / averageInterval);

    if (minBPM <= heartRate && heartRate < maxBPM) {
      return heartRate;
    } else {
      return null;
    }
  }

  /**
   * 脈拍を読み取る
   */
  async read(): Promise<{ heartRate: number | null }> {
    const values: Array<{ ir: number; red: number }> = [];

    for await (const value of this.readSamples()) {
      values.push(value);
    }

    const irValues = values.map(
      (sample: { ir: number; red: number }) => sample.ir,
    );

    const heartRate = this.detectHeartRate(irValues);

    return { heartRate };
  }
}

export default MAX30102;
