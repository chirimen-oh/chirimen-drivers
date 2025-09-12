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
  private device: I2CSlaveDevice | null = null;

  /**
   * @param port I2Cポート
   * @param address I2Cアドレス(デフォルト: 0x57)
   */
  constructor(public port: I2CPort, public address = 0x57) {}

  /**
   * 初期化・設定
   */
  async init(): Promise<void> {
    this.device = await this.port.open(this.address);
    await this.reset();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await this.device.read8(REG_INTR_STATUS_1);
    await this.setup();
  }

  /**
   * センサーのリセット
   */
  async reset(): Promise<void> {
    if (!this.device) throw new Error("Device not initialized");
    await this.device.write8(REG_MODE_CONFIG, 0x40);
  }

  /**
   * センサーのシャットダウン
   */
  async shutdown(): Promise<void> {
    if (!this.device) throw new Error("Device not initialized");
    await this.device.write8(REG_MODE_CONFIG, 0x80);
  }

  /**
   * センサーの設定
   * @param ledMode LEDモード (0x02: 読み取り専用, 0x03: SpO2モード, 0x07: マルチモードLED)
   */
  async setup(ledMode = 0x03): Promise<void> {
    if (!this.device) throw new Error("Device not initialized");

    await this.device.write8(REG_INTR_ENABLE_1, 0xc0);
    await this.device.write8(REG_INTR_ENABLE_2, 0x00);

    await this.device.write8(REG_FIFO_WR_PTR, 0x00);
    await this.device.write8(REG_OVF_COUNTER, 0x00);
    await this.device.write8(REG_FIFO_RD_PTR, 0x00);

    await this.device.write8(REG_FIFO_CONFIG, 0x4f);

    await this.device.write8(REG_MODE_CONFIG, ledMode);
    await this.device.write8(REG_SPO2_CONFIG, 0x27);

    await this.device.write8(REG_LED1_PA, 0x24);
    await this.device.write8(REG_LED2_PA, 0x24);
    await this.device.write8(REG_PILOT_PA, 0x7f);
  }

  /**
   * 未読み出しサイズ(読み取り位置と書き込み位置の差分)を取得 (最大32)
   */
  async available(): Promise<number> {
    if (!this.device) throw new Error("Device not initialized");

    const readPtr = await this.device.read8(REG_FIFO_RD_PTR);
    const writePtr = await this.device.read8(REG_FIFO_WR_PTR);

    return 0x1f & (writePtr - readPtr);
  }

  /**
   * 赤外線・赤色光を1回読み取る
   */
  async readSample(): Promise<{ ir: number; red: number }> {
    if (!this.device) throw new Error("Device not initialized");

    await this.device.read8(REG_INTR_STATUS_1);
    await this.device.read8(REG_INTR_STATUS_2);

    await this.device.writeByte(REG_FIFO_DATA);
    const data = await this.device.readBytes(6);

    const red = ((data[0] << 16) | (data[1] << 8) | data[2]) & 0x03ffff;
    const ir = ((data[3] << 16) | (data[4] << 8) | data[5]) & 0x03ffff;

    return { ir, red };
  }

  /**
   * 赤外線・赤色光を読み取る (サンプリングレート: 約 25.125 Hz)
   * @param samples 読み取り回数 (デフォルト: 100 回 ≒ 4 秒)
   */
  async *readSamples(
    samples = 100,
  ): AsyncGenerator<{ ir: number; red: number }> {
    while (samples > 0) {
      for (
        let bytes = await this.available();
        0 < samples && 0 < bytes;
        samples--, bytes--
      ) {
        yield await this.readSample();
      }
    }
  }
}

export default MAX30102;
