# DRV2605L

DRV2605Lは、I2Cで制御するハプティックモータードライバーです。

このCHIRIMENドライバーはERM振動モーターに対応し、内蔵波形エフェクトの再生とReal-Time Playback（RTP）モードによる振動制御を行えます。

## 仕様

- デバイス: DRV2605L
- インターフェイス: I2C
- デフォルトI2Cアドレス: `0x5A`
- 対応モーター: ERM
- 内蔵波形エフェクト: 1〜123
- RTP振動強度: 0〜127

## インストール

```bash
npm install @chirimen/drv2605l
```

## 使用方法

```js
import { requestI2CAccess } from "node-web-i2c";
import DRV2605L from "@chirimen/drv2605l";

const i2cAccess = await requestI2CAccess();
const i2cPort = i2cAccess.ports.get(1);

const motor = new DRV2605L(i2cPort, 0x5a);

await motor.init();

// 強度100で200ミリ秒振動
await motor.vibrate(100, 200);
```

## API

### `constructor(i2cPort, slaveAddress)`

DRV2605Lドライバーのインスタンスを生成します。

- `i2cPort`: I2Cポートのインスタンス
- `slaveAddress`: I2Cスレーブアドレス。省略時は `0x5A`

### `init()`

DRV2605LをERM振動モーター用に初期化します。

ERM用エフェクトライブラリを選択し、ERMオープンループ動作用に設定します。

### `playEffect(effect = 1)`

DRV2605Lに内蔵されている波形エフェクトを再生します。

- `effect`: エフェクト番号を`1`〜`123`の整数で指定します。デフォルト値は `1` です。

例:

```js
await motor.playEffect(1);
```

### `vibrate(strength = 100, duration = 200)`

Real-Time Playback（RTP）モードを使用して振動モーターを動作させます。

- `strength`: 振動強度を `0`〜`127` の整数で指定します。デフォルト値は `100` です。
- `duration`: 振動時間を0以上の整数でミリ秒単位で指定します。デフォルト値は `200` です。

例:

```js
await motor.vibrate(100, 200);
```

### `stop()`

波形エフェクトの再生およびRTP振動を停止します。

例:

```js
await motor.stop();
```

## データシート

Texas Instruments DRV2605L:

https://www.ti.com/product/DRV2605L
