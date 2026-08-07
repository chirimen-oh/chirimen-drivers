# @chirimen/apds9930

CHIRIMEN driver for APDS9930 (Digital Proximity and Ambient Light Sensor)

Broadcom (旧Avago)製の環境光・近接センサー APDS9930 用のCHIRIMENドライバです。
可視光＋赤外光を検出するCh0と、赤外光のみを検出するCh1の2チャンネルから照度を算出するほか、内蔵の赤外LEDを使った近接センサーとしての値も取得できます。

## 主な仕様

| 項目               | 内容                                  |
| ------------------ | ------------------------------------- |
| 型番               | APDS9930                              |
| インターフェース   | I2C                                   |
| I2Cアドレス        | `0x39`                                |
| 測定項目           | 照度(`lux`)、近接(`proximity`)        |
| ALSゲイン          | 1倍・8倍・16倍・120倍から選択可       |
| Proximityゲイン    | 1倍(既定)・2倍・4倍・8倍から選択可    |
| Proximity用LED電流 | 100mA(既定)・50・25・12.5mAから選択可 |

## Installation

```sh
npm install @chirimen/apds9930
```

## Usage

```js
import { requestI2CAccess } from "node-web-i2c";
import APDS9930 from "@chirimen/apds9930";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const i2cAccess = await requestI2CAccess();
const apds9930 = new APDS9930(i2cAccess.ports.get(1));

await apds9930.init();

while (true) {
  const { lux, proximity } = await apds9930.read();
  console.log(`照度: ${lux} lx, 近接: ${proximity}`);
  await sleep(1000);
}
```

## API

### `new APDS9930(i2cPort, slaveAddress = 0x39)`

ドライバのインスタンスを生成します。

- `i2cPort`: `requestI2CAccess()` で取得したI2Cポート
- `slaveAddress`: I2Cアドレス（省略可。デフォルト値: `0x39`）

### `async init()`

センサーを初期化します。チップIDの確認・電源ONの後、ALS/Proximityの測定を開始し、
最初の測定値が有効になるまで待ちます。
初期化に失敗した場合は `null` を返します。

### `async setAGain(gain)`

ALS（照度）測定のゲインを設定します。指定できる値は `1, 8, 16, 120` のいずれかです。
無効な値を渡した場合は `null` を返します。

### `async setPGain(gain)`

Proximity（近接）測定のゲインを設定します。指定できる値は `1, 2, 4, 8` のいずれかです。
無効な値を渡した場合は `null` を返します。
近距離で `proximity` が常に `1023` に張り付いてしまう場合は、値を下げてください（[トラブルシューティング](#proximityが常に1023になる)を参照）。

### `async setLEDDrive(ma)`

Proximity測定用の赤外線LEDのドライブ電流を設定します。指定できる値は `100, 50, 25, 12.5`（単位: mA）のいずれかです。
無効な値を渡した場合は `null` を返します。

### `async readAmbientLight()`

照度を測定します。

| 返り値 | 型     | 説明         |
| :----- | :----- | :----------- |
| lux    | Number | 照度(ルクス) |

### `async readProximity()`

近接センサーの値を測定します。数値が大きいほど対象物が近いことを示します（目安: 0〜1023）。

| 返り値    | 型     | 説明                                                 |
| :-------- | :----- | :--------------------------------------------------- |
| proximity | Number | 近接値（0〜65535、実用上のおおよその上限は1023程度） |

`proximity`はcmやmmなどの距離の単位を持たない、赤外LEDの反射光量に基づく**無単位の相対値（ADCカウント値）**です。
同じ距離でも対象物の反射率や[setPGain()](#async-setpgaingain)・[setLEDDrive()](#async-setleddrivema)の設定によって値は変化するため、実際の距離(cm)に換算したい場合は既知の距離で測定した値をもとに自分でキャリブレーションしてください。

### `async read()`

照度・近接の両方をまとめて測定し、結果をオブジェクトで返します。

```javascript
{
  lux: number,
  proximity: number
}
```

## トラブルシューティング

### `proximity`が常に`1023`になる

Proximity値は10bit ADCによる測定のため、実用上の上限は`1023`です。
何もセンサーに近づけていないのに常に`1023`になる場合は、ゲイン・LED電流に対してクロストーク（内蔵赤外LEDの光が対象物を介さず直接受光部に回り込む現象）や近距離の反射物の影響が強すぎて飽和している可能性が高いです。

対処法（効果が大きい順）:

1. センサーと対象物の間に一定の距離（数cm以上）を確保する
2. `setPGain(1)` などゲインを下げる（デフォルトは`1`倍ですが、`init()`前後で確認してください）
3. `setLEDDrive(25)` などLEDドライブ電流を下げる
4. 基板の実装によっては送光部・受光部の間に光学的な仕切り（バッフル）がないとクロストークが発生しやすいため、ハードウェア側の遮光も確認する

## データシート

- [APDS-9930 Datasheet (Broadcom)](https://docs.broadcom.com/doc/AV02-4191EN)

## 参考

- [Depau/APDS9930](https://github.com/Depau/APDS9930)（レジスタマップ・照度計算式の参考元。SparkFunのAPDS-9960用ライブラリをAPDS-9930向けに移植したフォーク）
