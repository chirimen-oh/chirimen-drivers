// @ts-check

// VL6180X.js
//
// VL6180X ToF距離センサライブラリ for CHIRIMEN WebI2C
//
// by Satoru Takagi
//
// ported from https://github.com/adafruit/Adafruit_CircuitPython_VL6180X/blob/main/adafruit_vl6180x.py
//
// History:
// 2025/08/28 : initial version
//

class VL6180X {
  /**
   * @constructor
   * @param {import('node-web-i2c').I2CPort} i2cPort I2C port instance
   * @param {number?} slaveAddress I2C slave address
   */
  constructor(i2cPort, slaveAddress) {
    // Registers
    this._VL6180X_REG_IDENTIFICATION_MODEL_ID = 0x00;
    this._VL6180X_REG_SYSTEM_HISTORY_CTRL = 0x12;
    this._VL6180X_REG_SYSTEM_INTERRUPT_CONFIG = 0x14;
    this._VL6180X_REG_SYSTEM_INTERRUPT_CLEAR = 0x15;
    this._VL6180X_REG_SYSTEM_FRESH_OUT_OF_RESET = 0x16;
    this._VL6180X_REG_SYSRANGE_START = 0x18;
    this._VL6180X_REG_SYSRANGE_INTERMEASUREMENT_PERIOD = 0x1b;
    this._VL6180X_REG_SYSRANGE_PART_TO_PART_RANGE_OFFSET = 0x24;
    this._VL6180X_REG_SYSALS_START = 0x38;
    this._VL6180X_REG_SYSALS_ANALOGUE_GAIN = 0x3f;
    this._VL6180X_REG_SYSALS_INTEGRATION_PERIOD_HI = 0x40;
    this._VL6180X_REG_SYSALS_INTEGRATION_PERIOD_LO = 0x41;
    this._VL6180X_REG_RESULT_RANGE_STATUS = 0x4d;
    this._VL6180X_REG_RESULT_INTERRUPT_STATUS_GPIO = 0x4f;
    this._VL6180X_REG_RESULT_ALS_VAL = 0x50;
    this._VL6180X_REG_RESULT_HISTORY_BUFFER_0 = 0x52;
    this._VL6180X_REG_RESULT_RANGE_VAL = 0x62;
    // Internal constants:
    this._VL6180X_DEFAULT_I2C_ADDR = 0x29;
    // User-facing constants:
    this.ALS_GAIN_1 = 0x06;
    this.ALS_GAIN_1_25 = 0x05;
    this.ALS_GAIN_1_67 = 0x04;
    this.ALS_GAIN_2_5 = 0x03;
    this.ALS_GAIN_5 = 0x02;
    this.ALS_GAIN_10 = 0x01;
    this.ALS_GAIN_20 = 0x00;
    this.ALS_GAIN_40 = 0x07;
    this.ERROR_NONE = 0;
    this.ERROR_SYSERR_1 = 1;
    this.ERROR_SYSERR_5 = 5;
    this.ERROR_ECEFAIL = 6;
    this.ERROR_NOCONVERGE = 7;
    this.ERROR_RANGEIGNORE = 8;
    this.ERROR_SNR = 11;
    this.ERROR_RAWUFLOW = 12;
    this.ERROR_RAWOFLOW = 13;
    this.ERROR_RANGEUFLOW = 14;
    this.ERROR_RANGEOFLOW = 15;

    if (!slaveAddress) {
      slaveAddress = this._VL6180X_DEFAULT_I2C_ADDR;
    }

    this.i2cPort = i2cPort;
    this.slaveAddress = slaveAddress;
    this.i2cSlave = null;
    this._offset = 0;
  }

  async init() {
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);

    if (
      (await this._read8(this._VL6180X_REG_IDENTIFICATION_MODEL_ID)) != 0xb4
    ) {
      console.error("Could not find VL6180X, is it connected and powered?");
      return;
    }

    console.log(
      "Model ID:",
      (await this._read8(this._VL6180X_REG_IDENTIFICATION_MODEL_ID)).toString(
        16,
      ),
    );

    await this._load_settings();
    await this._write8(this._VL6180X_REG_SYSTEM_FRESH_OUT_OF_RESET, 0x00);

    // Reset a sensor that crashed while in continuous mode
    if (await this.continuous_mode_enabled()) {
      await this.stop_range_continuous();
      await sleep(100);
    }

    // Activate history buffer for range measurement
    await this._write8(this._VL6180X_REG_SYSTEM_HISTORY_CTRL, 0x01);

    console.log("VL6180X initialized via WebI2C");
  }

  async _load_settings() {
    // private settings from page 24 of app note
    await this._write8(0x0207, 0x01);
    await this._write8(0x0208, 0x01);
    await this._write8(0x0096, 0x00);
    await this._write8(0x0097, 0xfd);
    await this._write8(0x00e3, 0x00);
    await this._write8(0x00e4, 0x04);
    await this._write8(0x00e5, 0x02);
    await this._write8(0x00e6, 0x01);
    await this._write8(0x00e7, 0x03);
    await this._write8(0x00f5, 0x02);
    await this._write8(0x00d9, 0x05);
    await this._write8(0x00db, 0xce);
    await this._write8(0x00dc, 0x03);
    await this._write8(0x00dd, 0xf8);
    await this._write8(0x009f, 0x00);
    await this._write8(0x00a3, 0x3c);
    await this._write8(0x00b7, 0x00);
    await this._write8(0x00bb, 0x3c);
    await this._write8(0x00b2, 0x09);
    await this._write8(0x00ca, 0x09);
    await this._write8(0x0198, 0x01);
    await this._write8(0x01b0, 0x17);
    await this._write8(0x01ad, 0x00);
    await this._write8(0x00ff, 0x05);
    await this._write8(0x0100, 0x05);
    await this._write8(0x0199, 0x05);
    await this._write8(0x01a6, 0x1b);
    await this._write8(0x01ac, 0x3e);
    await this._write8(0x01a7, 0x1f);
    await this._write8(0x0030, 0x00);
    // Recommended : Public registers - See data sheet for more detail
    await this._write8(0x0011, 0x10); // Enables polling for 'New Sample ready'
    // when measurement completes
    await this._write8(0x010a, 0x30); // Set the averaging sample period
    // (compromise between lower noise and
    // increased execution time)
    await this._write8(0x003f, 0x46); // Sets the light and dark gain (upper
    // nibble). Dark gain should not be
    // changed.
    await this._write8(0x0031, 0xff); // sets the # of range measurements after
    // which auto calibration of system is
    // performed
    await this._write8(0x0040, 0x63); // Set ALS integration time to 100ms
    await this._write8(0x002e, 0x01); // perform a single temperature calibration
    // of the ranging sensor

    // Optional: Public registers - See data sheet for more detail
    await this._write8(0x001b, 0x09); // Set default ranging inter-measurement
    // period to 100ms
    await this._write8(0x003e, 0x31); // Set default ALS inter-measurement period
    // to 500ms
    await this._write8(0x0014, 0x24); // Configures interrupt on 'New Sample
    // Ready threshold event'
  }

  /**
   * 指定された16ビットレジスタアドレスに1バイトのデータを書き込みます。
   * @param {number} address - 16ビットのレジスタアドレス
   * @param {number} data - 書き込む1バイトのデータ (8ビット)
   */
  async _write8(address, data) {
    const buffer = new Uint8Array([
      (address >> 8) & 0xff,
      address & 0xff,
      data,
    ]);
    await this.i2cSlave.writeBytes(buffer);
  }

  /**
   * 指定された16ビットレジスタアドレスに16ビットのデータを書き込みます (ビッグエンディアン)。
   * @param {number} address - 16ビットのレジスタアドレス
   * @param {number} data - 書き込む16ビットのデータ
   */
  async _write16(address, data) {
    const buffer = new Uint8Array([
      (address >> 8) & 0xff,
      address & 0xff,
      (data >> 8) & 0xff,
      data & 0xff,
    ]);
    await this.i2cSlave.writeBytes(buffer);
  }

  /**
   * 指定された16ビットレジスタアドレスから1バイトのデータを読み取ります。
   * @param {number} address - 16ビットのレジスタアドレス
   * @returns {Promise<number>} - 読み取った1バイトのデータ
   */
  async _read8(address) {
    const addressBuffer = new Uint8Array([
      (address >> 8) & 0xff,
      address & 0xff,
    ]);
    await this.i2cSlave.writeBytes(addressBuffer);
    const byte = await this.i2cSlave.readByte();
    return byte;
  }

  /**
   * 指定された16ビットレジスタアドレスから16ビットのデータを読み取ります (ビッグエンディアン)。
   * @param {number} address - 16ビットのレジスタアドレス
   * @returns {Promise<number>} - 読み取った16ビットのデータ
   */
  async _read16(address) {
    const addressBuffer = new Uint8Array([
      (address >> 8) & 0xff,
      address & 0xff,
    ]);
    await this.i2cSlave.writeBytes(addressBuffer);
    const dataBuffer = await this.i2cSlave.readBytes(2);
    return (dataBuffer[0] << 8) | dataBuffer[1];
  }

  /**
   * センサーの距離を読み取ります。連続モードの場合は連続的に読み込み、
   * シングルモードの場合は一度だけ読み込みます。
   * @returns {Promise<number>} - 読み取った距離 (mm)
   */
  async getRange() {
    const continuousMode = await this.continuous_mode_enabled();
    if (continuousMode) {
      return await this._read_range_continuous();
    }
    return await this._read_range_single();
  }

  /**
   * センサーのオフセットを読み書きします (mm)。
   * @type {number}
   */
  get offset() {
    return this._offset;
  }

  set offset(offset) {
    // Pythonのstruct.pack('b', offset)[0]は、JavaScriptでは単に値を書き込むことで実現できます。
    this._write8(
      this._VL6180X_REG_SYSRANGE_PART_TO_PART_RANGE_OFFSET,
      offset & 0xff,
    );
    this._offset = offset;
  }

  /**
   * 連続距離測定モードを開始します。
   * @param {number} [period=100] - 測定間の遅延時間 (ミリ秒)。
   */
  async start_range_continuous(period = 100) {
    if (period < 20 || period > 2550 || period % 10 !== 0) {
      throw new Error(
        "Delay must be in 10 millisecond increments between 20 and 2550 milliseconds",
      );
    }
    const periodReg = Math.floor(period / 10) - 1;
    await this._write8(
      this._VL6180X_REG_SYSRANGE_INTERMEASUREMENT_PERIOD,
      periodReg,
    );
    await this._write8(this._VL6180X_REG_SYSRANGE_START, 0x03);
  }

  /**
   * 連続距離測定モードを停止します。
   */
  async stop_range_continuous() {
    const continuousMode = await this.continuous_mode_enabled();
    if (continuousMode) {
      await this._write8(this._VL6180X_REG_SYSRANGE_START, 0x01);
    }
  }

  /**
   * 連続モードが有効かどうかをチェックします。
   * @returns {Promise<boolean>}
   */
  async continuous_mode_enabled() {
    const sysRangeStart = await this._read8(this._VL6180X_REG_SYSRANGE_START);
    return (sysRangeStart & 0x1) > 0;
  }

  /**
   * シングルショットモードでの距離を読み取ります。
   * @returns {Promise<number>}
   */
  async _read_range_single() {
    await this._write8(this._VL6180X_REG_SYSRANGE_START, 0x01);
    // Wait for the measurement to complete
    let status = 0;
    while (!(status & 0x01)) {
      await sleep(10); // 短い待ち時間を挿入
      status = await this._read8(this._VL6180X_REG_RESULT_RANGE_STATUS);
    }

    const range = await this._read8(this._VL6180X_REG_RESULT_RANGE_VAL);
    return range;
  }

  /**
   * 連続モードでの距離を読み取ります。
   * @returns {Promise<number>}
   */
  async _read_range_continuous() {
    // Wait until bit 2 is set (New Sample Ready)
    let status = 0;
    while (!((status >> 2) & 0x01)) {
      await sleep(10); // 短い待ち時間を挿入
      status = await this._read8(
        this._VL6180X_REG_RESULT_INTERRUPT_STATUS_GPIO,
      );
    }

    const range = await this._read8(this._VL6180X_REG_RESULT_RANGE_VAL);
    // Clear interrupt
    await this._write8(this._VL6180X_REG_SYSTEM_INTERRUPT_CLEAR, 0x07);
    return range;
  }

  /**
   * センサーのALS（環境光センサ）値を読み取ります。
   * @param {number} gain - ALSのゲイン値 (ALS_GAIN_xx 定数を使用)
   * @returns {Promise<number>} - 読み取ったルクス (lux) 値
   */
  async read_lux(gain) {
    let reg = await this._read8(this._VL6180X_REG_SYSTEM_INTERRUPT_CONFIG);
    reg &= ~0x38;
    reg |= 0x4 << 3; // IRQ on ALS ready
    await this._write8(this._VL6180X_REG_SYSTEM_INTERRUPT_CONFIG, reg);
    // 100 ms integration period
    await this._write8(this._VL6180X_REG_SYSALS_INTEGRATION_PERIOD_HI, 0);
    await this._write8(this._VL6180X_REG_SYSALS_INTEGRATION_PERIOD_LO, 100);
    // analog gain
    gain = Math.min(gain, this.ALS_GAIN_40);
    await this._write8(this._VL6180X_REG_SYSALS_ANALOGUE_GAIN, 0x40 | gain);
    // start ALS
    await this._write8(this._VL6180X_REG_SYSALS_START, 0x1);

    // Poll until "New Sample Ready threshold event" is set
    let status = 0;
    while (((status >> 3) & 0x7) !== 4) {
      await sleep(10);
      status = await this._read8(
        this._VL6180X_REG_RESULT_INTERRUPT_STATUS_GPIO,
      );
    }

    // read lux!
    let lux = await this._read16(this._VL6180X_REG_RESULT_ALS_VAL);
    // clear interrupt
    await this._write8(this._VL6180X_REG_SYSTEM_INTERRUPT_CLEAR, 0x07);
    lux *= 0.32; // calibrated count/lux

    switch (gain) {
      case this.ALS_GAIN_1_25:
        lux /= 1.25;
        break;
      case this.ALS_GAIN_1_67:
        lux /= 1.67;
        break;
      case this.ALS_GAIN_2_5:
        lux /= 2.5;
        break;
      case this.ALS_GAIN_5:
        lux /= 5;
        break;
      case this.ALS_GAIN_10:
        lux /= 10;
        break;
      case this.ALS_GAIN_20:
        lux /= 20;
        break;
      case this.ALS_GAIN_40:
        lux /= 40;
        break;
    }

    lux *= 100;
    lux /= 100; // integration time in ms
    return lux;
  }

  /**
   * 以前の距離測定でのステータス/エラーを取得します。
   * @returns {Promise<number>} - 距離ステータス
   */
  async getRangeStatus() {
    const status = await this._read8(this._VL6180X_REG_RESULT_RANGE_STATUS);
    return status >> 4;
  }

  /**
   * ヒストリバッファから最新の距離データを読み取ります。
   * @returns {Promise<number | null>}
   */
  async range_from_history() {
    const enabled = await this.range_history_enabled();
    if (!enabled) {
      return null;
    }
    return await this._read8(this._VL6180X_REG_RESULT_HISTORY_BUFFER_0);
  }

  /**
   * ヒストリバッファから過去16個の距離測定値を読み取ります。
   * @returns {Promise<number[] | null>}
   */
  async ranges_from_history() {
    const enabled = await this.range_history_enabled();
    if (!enabled) {
      return null;
    }

    const history = [];
    for (let i = 0; i < 16; i++) {
      history.push(
        await this._read8(this._VL6180X_REG_RESULT_HISTORY_BUFFER_0 + i),
      );
    }
    return history;
  }

  /**
   * ヒストリバッファが距離データを保存しているかチェックします。
   * @returns {Promise<boolean>}
   */
  async range_history_enabled() {
    const historyCtrl = await this._read8(
      this._VL6180X_REG_SYSTEM_HISTORY_CTRL,
    );
    if ((historyCtrl & 0x0) === 0) {
      console.log("History buffering not enabled");
      return false;
    }
    if (historyCtrl > 1 && (historyCtrl & 0x1) === 0) {
      console.log("History buffer stores ALS data, not range");
      return false;
    }
    return true;
  }
}

// スリープ関数（ミリ秒単位）
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default VL6180X;
