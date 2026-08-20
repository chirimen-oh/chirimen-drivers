// @ts-check
// SGP30 driver for CHIRIMEN
// For Sensirion SGP30 TVOC/eCO2 gas sensor
// Based on https://github.com/adafruit/Adafruit_SGP30
// and https://sensirion.com/media/documents/984E0DD5/61644B8B/Sensirion_Gas_Sensors_Datasheet_SGP30.pdf
// Programmed by Shunpei Ueda

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// データシート Table 10 の転記。
// code: 16bit のコマンド、wait: コマンド発行後に必要な待ち時間 [ms]、words: 応答のワード数
// 1 ワード = データ 2 バイト (MSB first) + CRC 1 バイト
const INIT_AIR_QUALITY = { code: 0x2003, wait: 10, words: 0 };
const MEASURE_AIR_QUALITY = { code: 0x2008, wait: 12, words: 2 };
const GET_BASELINE = { code: 0x2015, wait: 10, words: 2 };
const SET_BASELINE = { code: 0x201e, wait: 10, words: 0 };
const GET_FEATURE_SET = { code: 0x202f, wait: 10, words: 1 };
const MEASURE_RAW = { code: 0x2050, wait: 25, words: 2 };
const GET_SERIAL_ID = { code: 0x3682, wait: 10, words: 3 };

// CRC-8: 多項式 0x31、初期値 0xFF、リフレクトなし、最終 XOR なし
const CRC8_POLYNOMIAL = 0x31;
const CRC8_INIT = 0xff;

// Get feature set の応答 (データシート Table 9)。
// 上位バイト = 製品タイプ (SGP30 は 0)、下位 3bit = 予約、最下位 5bit = 版数。
// 版数は「変更されうる」とデータシートに明記されているため製品タイプだけで判定する。
// 移植元の Adafruit は (featureSet & 0xF0) === 0x0020 で判定しているが、
// これでは SGP40 (0x3220) も通ってしまい、版数の変更でも誤判定するため採用しない。
const PRODUCT_TYPE_SGP30 = 0x00;

const BASELINE_MAX = 0xffff;

class SGP30 {
  /**
   * @param {import('node-web-i2c').I2CPort} i2cPort
   * @param {number} slaveAddress 省略時は 0x58 (SGP30 は固定)
   */
  constructor(i2cPort, slaveAddress = 0x58) {
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;
  }

  /**
   * I2C ポートを開き、疎通確認をしてから IAQ アルゴリズムを開始する。
   * 使用前に必ず一回実行する。
   * @returns {Promise<SGP30>}
   */
  async init() {
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);

    // 配線ミス・アドレス違いをここで検出する
    const [featureSet] = await this.#readWords(GET_FEATURE_SET);
    const productType = featureSet >> 8;
    if (productType !== PRODUCT_TYPE_SGP30) {
      throw new Error(
        `SGP30.init: this is not an SGP30 (product type ${productType}, feature set 0x${featureSet.toString(16).padStart(4, "0")}). Check wiring and I2C address.`,
      );
    }

    await this.#sendCommand(INIT_AIR_QUALITY);
    return this;
  }

  /**
   * 空気品質を測定する。
   * 動的ベースライン補正のため、約 1 秒間隔で呼び続ける必要がある。
   * init() 直後の約 15 秒間は初期化フェーズで、eCO2 = 400 / tvoc = 0 の固定値が返る。
   * @returns {Promise<{eCO2: number, tvoc: number}>} eCO2 [ppm] と TVOC [ppb]
   */
  async read() {
    const [eCO2, tvoc] = await this.#readWords(MEASURE_AIR_QUALITY);
    return { eCO2, tvoc };
  }

  /**
   * センサー素子の生信号を読む。単位はティック (無次元)。
   * @returns {Promise<{h2: number, ethanol: number}>} H2 信号とエタノール信号
   */
  async readRaw() {
    const [h2, ethanol] = await this.#readWords(MEASURE_RAW);
    return { h2, ethanol };
  }

  /**
   * 48bit のシリアル番号を読む。個体ごとに固有で、疎通確認に使える。
   * @returns {Promise<string>} 12 桁の小文字16進文字列 (例 "000012345678")
   */
  async readSerialNumber() {
    const words = await this.#readWords(GET_SERIAL_ID);
    return words.map((word) => word.toString(16).padStart(4, "0")).join("");
  }

  /**
   * ベースライン補正アルゴリズムの内部状態を取得する。
   * ppm / ppb ではなく、setBaseline() に渡すための不透明な値。
   *
   * 確立していない間は { eCO2: 0, tvoc: 0 } が返る (実測では init() から約15秒で有効化)。
   * ただし非ゼロになっても保存してよいわけではなく、Sensirion のドライバー統合ガイドは
   * 保存できるようになるまで12時間の連続運転を求めている。
   * @returns {Promise<{eCO2: number, tvoc: number}>} 0 のときは未確立
   */
  async getBaseline() {
    // データシート: 応答は (CO2eq, TVOC) の順
    const [eCO2, tvoc] = await this.#readWords(GET_BASELINE);
    return { eCO2, tvoc };
  }

  /**
   * 保存しておいたベースラインを復元する。init() の後に呼ぶ必要がある。
   *
   * 保存から1週間以上経った値は渡してはいけない (Sensirion のドライバー統合ガイド)。
   * 古い基準で補正すると測定値がずれる。値の保存・保存時刻の記録・鮮度の判定は
   * いずれもアプリケーション側の責任で、このドライバーは関与しない。
   *
   * 渡す値は getBaseline() が返したものをそのまま使うこと。
   * @param {number} eCO2 getBaseline() で得た eCO2。0 - 65535 の整数
   * @param {number} tvoc getBaseline() で得た tvoc。0 - 65535 の整数
   */
  async setBaseline(eCO2, tvoc) {
    for (const [name, value] of [
      ["eCO2", eCO2],
      ["tvoc", tvoc],
    ]) {
      if (!Number.isInteger(value) || value < 0 || value > BASELINE_MAX) {
        throw new Error(
          `SGP30.setBaseline: ${name} must be an integer between 0 and ${BASELINE_MAX}, got ${value}`,
        );
      }
    }

    // データシート: パラメータは (TVOC, CO2eq) の順で送る。getBaseline() の応答順とは逆。
    await this.#sendCommand(SET_BASELINE, [
      ...this.#wordWithCrc(tvoc),
      ...this.#wordWithCrc(eCO2),
    ]);
  }

  /** 16bit 値を [MSB, LSB, CRC] のバイト列にする */
  #wordWithCrc(value) {
    const bytes = [(value >> 8) & 0xff, value & 0xff];
    return [...bytes, this.#crc8(bytes)];
  }

  /** コマンドと任意のパラメータを送り、規定の待ち時間だけ待つ */
  async #sendCommand(command, payload = []) {
    if (this.i2cSlave === null) {
      throw new Error("SGP30: i2cSlave is not initialized. Call init() first.");
    }
    await this.i2cSlave.writeBytes([
      (command.code >> 8) & 0xff,
      command.code & 0xff,
      ...payload,
    ]);
    await sleep(command.wait);
  }

  /** コマンドを送り、応答のワードを CRC 検証しつつ配列で返す */
  async #readWords(command) {
    await this.#sendCommand(command);
    const bytes = await this.i2cSlave.readBytes(command.words * 3);
    const words = [];
    for (let i = 0; i < bytes.length; i += 3) {
      const data = bytes.slice(i, i + 2);
      if (this.#crc8(data) !== bytes[i + 2]) {
        throw new Error(
          `SGP30: CRC error on command 0x${command.code.toString(16)}`,
        );
      }
      words.push((data[0] << 8) | data[1]);
    }
    return words;
  }

  /** CRC-8 (多項式 0x31 / 初期値 0xFF)。CRC(0xBEEF) = 0x92 で検算できる */
  #crc8(bytes) {
    let crc = CRC8_INIT;
    for (const byte of bytes) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) {
        crc = crc & 0x80 ? (crc << 1) ^ CRC8_POLYNOMIAL : crc << 1;
      }
    }
    return crc & 0xff;
  }
}

export default SGP30;
