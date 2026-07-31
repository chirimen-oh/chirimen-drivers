# @chirimen/as7341

CHIRIMEN driver for AS7341 (11-channel spectral color sensor)

ams-OSRAM製の11チャンネル分光カラーセンサー AS7341 用のCHIRIMENドライバです。
本ドライバの read() では、可視光域をカバーする8つの分光チャンネル（F1〜F8: 415nm〜680nm）に加え、Clear（全可視光）とNIR（近赤外）の計10チャンネルの値を取得できます。
光の色成分・スペクトル分析、色識別、光源の種類判定などの用途に利用できます。
測定時間（ATIME/ASTEP）とゲイン（0.5倍〜512倍）を設定可能です。

## 主な仕様

| 項目             | 内容                               |
| ---------------- | ---------------------------------- |
| 型番             | AS7341                             |
| インターフェース | I2C                                |
| I2Cアドレス      | 0x39                               |
| 測定チャンネル   | F1〜F8（415nm〜680nm）、Clear、NIR |

## Installation

```sh
npm install @chirimen/as7341
```

## Usage

```javascript
import { requestI2CAccess } from "chirimen";
import AS7341 from "@chirimen/as7341";

const i2cAccess = await requestI2CAccess();
const i2cPort = i2cAccess.ports.get(1);
const as7341 = new AS7341(i2cPort, 0x39);

await as7341.init();

setInterval(async () => {
  const data = await as7341.read();
  // { f1, f2, f3, f4, f5, f6, f7, f8, clear, nir }
  console.log(data);
}, 1000);
```

## API

### `new AS7341(i2cPort, slaveAddress)`

ドライバのインスタンスを生成します。

- `i2cPort`: `requestI2CAccess()` で取得したI2Cポート
- `slaveAddress`: I2Cアドレス（`0x39`）

### `async init()`

センサーを初期化します。チップIDの確認・電源ONの後、測定条件のデフォルト値
（ATIME=100、ASTEP=999、ゲイン=256倍）を設定します。
初期化に失敗した場合は `null` を返します。

### `async setATIME(value)`

積分時間パラメータ ATIME を設定します（`0`〜`255`）。
範囲外の値を渡した場合は `null` を返します。

### `async setASTEP(value)`

積分ステップ時間パラメータ ASTEP を設定します（`0`〜`65534`）。
範囲外の値を渡した場合は `null` を返します。

### `async setGain(gain)`

ADCのゲイン（倍率）を設定します。指定できる値は
`0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512` のいずれかです。
無効な値を渡した場合は `null` を返します。

### `async read()`

全チャンネルの測定を行い、結果をオブジェクトで返します。
SMUXの切り替えを伴う2回の測定（F1〜F4系→F5〜F8系）を内部で実行します。

```javascript
{
  f1: number,    // 415nm
  f2: number,    // 445nm
  f3: number,    // 480nm
  f4: number,    // 515nm
  f5: number,    // 555nm
  f6: number,    // 590nm
  f7: number,    // 630nm
  f8: number,    // 680nm
  clear: number, // 全可視光
  nir: number    // 近赤外
}
```

## データシート

- [AS7341 Datasheet (ams-OSRAM)](https://www.mouser.jp/datasheet/3/5912/1/AS7341_DS000504_3_00.pdf)

## 参考

- [Adafruit_AS7341](https://github.com/adafruit/Adafruit_AS7341)（参考にした実装元）
