# SGP30

Sensirion SGP30 を搭載した室内空気品質センサ。eCO2（CO2相当値、ppm）と TVOC（総揮発性有機化合物、ppb）を
I2C で取得できる。センサー素子の生信号（水素・エタノール）も読み出せる。

動作確認は Raspberry Pi Zero で行った。センサーモジュールには M5Stack 製の TVOC/eCO2 ガスセンサユニット
（SKU: U088、HY2.0-4P / Grove 互換コネクタ）を使用した。

## 主な仕様

- インターフェース
  - I2C
- I2C スレーブアドレス
  - `0x58`（固定。変更できません）
- メーカー
  - Sensirion
- 測定範囲・分解能
  - eCO2: 400ppm - 60000ppm（400-1479ppm では 1ppm 刻み）
  - TVOC: 0ppb - 60000ppb（0-2008ppb では 1ppb 刻み）
- 電源電圧
  - SGP30 チップ本体: 1.62 - 1.98V（モジュール上の LDO が生成）
  - M5Stack U088 の VCC: **3.3V で駆動する**（下記「配線上の注意」参照）

## 使う前に知っておくこと

### 配線上の注意

**M5Stack U088 を Raspberry Pi に繋ぐ場合、VCC は 3.3V ピンに接続してください。**

ユニットには 5V と表示されていますが、基板上のレベルシフタ（BSS138）の高圧側プルアップが
コネクタの VCC ピンに接続されているため、I2C のロジックレベルは VCC に与えた電圧に追従します。
5V を与えると Raspberry Pi の SDA/SCL に 5V が乗り、GPIO を破損させるおそれがあります。
SGP30 チップ本体は基板上の LDO（RT9193-1.8V）から駆動されるため、VCC 3.3V で問題ありません。

### 測定上の注意

- **`init()` 直後の約15秒間は測定していません。** eCO2 = 400ppm / TVOC = 0ppb の固定値が返るだけなので、
  この間の値は捨ててください。生信号（`readRaw()`）はベースライン補正を受けないため、この期間も
  実際の値が返ります（ただしヒーターの暖機中は値が動き続けます）
- **`read()` は約1秒間隔で呼び続ける必要があります。** 動的ベースライン補正アルゴリズムがこの周期を
  前提にしており、間隔が乱れると補正が正しく働きません
- **eCO2 は本物の CO2 濃度ではありません。** SGP30 は MOX（金属酸化物）方式で、CO2 はこの方式では
  検出できません。室内では CO2 と他のガスが一緒に増えるという相関から推定した値です。換気の指標には
  使えますが、CO2 濃度計としては使えません。アルコールを近づけると CO2 が増えていないのに
  数千 ppm を示します

## インストール方法

```sh
npm install @chirimen/sgp30
```

## 使用方法

```javascript
import { requestI2CAccess } from "node-web-i2c";
import SGP30 from "@chirimen/sgp30";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const i2cAccess = await requestI2CAccess();
const i2cPort = i2cAccess.ports.get(1);
const sgp30 = new SGP30(i2cPort, 0x58);
await sgp30.init();
console.log(`serial number: ${await sgp30.readSerialNumber()}`);

// init() 直後から約15秒間は初期化フェーズのため、
// eCO2 = 400ppm / tvoc = 0ppb の固定値が返ります。
// また動的ベースライン補正のため、約1秒間隔で read() を呼び続ける必要があります。
while (true) {
  const { eCO2, tvoc } = await sgp30.read();
  const { h2, ethanol } = await sgp30.readRaw();
  console.log(
    `eCO2: ${eCO2} ppm, TVOC: ${tvoc} ppb, raw H2: ${h2}, raw Ethanol: ${ethanol}`,
  );

  await sleep(1000);
}
```

## API リファレンス

### 初期化 init()

```javascript
const sgp30 = new SGP30(i2cPort, 0x58);
await sgp30.init();
```

I2C ポートを開き、疎通確認をしてから測定を開始できる状態にします。センサーを使う前に必ず一回実行してください。

内部では Get feature set（`0x202F`）で製品タイプを確認し、SGP30 でなければ例外を投げます。配線ミスや
I2C アドレスの誤りをここで検出できます。そのあと Init air quality（`0x2003`）で IAQ アルゴリズムを開始します。

| 引数         | 型      | 説明                                                      |
| :----------- | :------ | :-------------------------------------------------------- |
| i2cPort      | I2CPort | 使用する I2C ポートの port オブジェクトです。             |
| slaveAddress | Number  | センサーの I2C スレーブアドレスです。省略時は 0x58 です。 |

### 測定 read()

```javascript
const data = await sgp30.read();
```

空気品質を測定します。約1秒間隔で呼び続けてください。

| 返り値 | 型     | 説明                                                 |
| :----- | :----- | :--------------------------------------------------- |
| o      | object | 測定結果が入った下記のメンバーを含むオブジェクトです |
| o.eCO2 | Number | CO2 相当値です。単位は ppm です。                    |
| o.tvoc | Number | 総揮発性有機化合物です。単位は ppb です。            |

### 生信号の測定 readRaw()

```javascript
const raw = await sgp30.readRaw();
```

センサー素子の生信号を読みます。`read()` の値はこの生信号をアルゴリズムが加工した結果で、こちらは
加工前の値です。ベースライン補正を受けないため、初期化フェーズの15秒間も実際の値が返ります。

**単位はティックで、物理的な単位を持ちません。値の向きが `read()` とは逆です。** ガス濃度が上がると
素子の抵抗が下がり、生信号の数値も下がります。

濃度への換算式はデータシートに記載があります。

```
c = cref × exp((sref - sout) / 512)
```

2点間の濃度比は `sref` を知らなくても `exp((s1 - s2) / 512)` で求められます。355 ティックの差が 2 倍、
512 ティックの差が e 倍に対応します。

| 返り値    | 型     | 説明                                                     |
| :-------- | :----- | :------------------------------------------------------- |
| o         | object | 測定結果が入った下記のメンバーを含むオブジェクトです     |
| o.h2      | Number | 水素センサー素子の生信号です。単位はティックです。       |
| o.ethanol | Number | エタノールセンサー素子の生信号です。単位はティックです。 |

### シリアル番号の取得 readSerialNumber()

```javascript
const serial = await sgp30.readSerialNumber();
```

センサー個体に固有の 48bit のシリアル番号を、12桁の小文字16進文字列で返します（例 `"000001f9293c"`）。

測定とは無関係で、値そのものに意味はありません。**疎通確認に使えます。** 配線と CRC が正しければ
必ず同じ値が返るため、測定値とは独立に通信の正しさを確認できます。

| 返り値 | 型     | 説明                         |
| :----- | :----- | :--------------------------- |
| serial | String | 12桁の小文字16進文字列です。 |

### ベースラインの取得 getBaseline()

```javascript
const baseline = await sgp30.getBaseline();
```

ベースライン補正アルゴリズムの内部状態を取得します。

**ppm / ppb ではありません。** 人間が読んで解釈する値ではなく、`setBaseline()` に渡して復元するためだけの
不透明な値です。確立していない間は `{ eCO2: 0, tvoc: 0 }` が返ります。

| 返り値 | 型     | 説明                                              |
| :----- | :----- | :------------------------------------------------ |
| o      | object | 下記のメンバーを含むオブジェクトです              |
| o.eCO2 | Number | eCO2 のベースライン値です。0 のときは未確立です。 |
| o.tvoc | Number | TVOC のベースライン値です。0 のときは未確立です。 |

### ベースラインの復元 setBaseline()

```javascript
await sgp30.setBaseline(baseline.eCO2, baseline.tvoc);
```

保存しておいたベースラインを復元します。**`init()` の後に呼ぶ必要があります**（データシートの指定）。

SGP30 は電源を切るとベースラインの学習結果を失い、精度が戻るまでに時間がかかります。`getBaseline()` の
値を保存しておいて起動時に書き戻すと、学習をやり直さずに済みます。

範囲外や非整数の値を渡すと例外を投げます。

| 引数 | 型     | 説明                                                   |
| :--- | :----- | :----------------------------------------------------- |
| eCO2 | Number | getBaseline() で得た eCO2 です。0 - 65535 の整数です。 |
| tvoc | Number | getBaseline() で得た tvoc です。0 - 65535 の整数です。 |

#### 値の保存についての制約

[Sensirion SGP30 Driver Integration Guide][統合ガイド] に記載されている条件です。データシートには
書かれていません。

| 条件                 | 値                  |
| :------------------- | :------------------ |
| 有効な値が返るまで   | `init()` から約60分 |
| 保存してよくなるまで | 12時間の連続運転    |
| 保存の推奨間隔       | 約1時間ごと         |
| 保存値の有効期限     | 最大7日             |

**1週間以上前に保存した値を渡してはいけません。** 古い基準で補正すると測定値がずれます。

このドライバは値の永続化そのものを実装していません。保存先・保存間隔・鮮度判定はアプリケーション側の
方針であり、ドライバの責務ではないと判断しました。

#### 実装上の注意（電文のパラメータ順が逆）

データシートより、`get` と `set` でパラメータの順番が逆になっています。

- `sgp30_get_iaq_baseline` の応答は "in the order **CO2eq and TVOC**"
- `sgp30_set_iaq_baseline` のパラメータは "in the order as **(TVOC, CO2eq)**"

**このドライバは引数・返り値をどちらも eCO2 を先に統一し、電文の入れ替えは内部で吸収しています。**
利用者が意識する必要はありません。

移植元の Adafruit のライブラリも同じ方針です。ここを取り違えると I2C 通信としてはエラーにならず
CRC も通るため、「エラーは出ないのに値がおかしい」という発見しにくい不具合になります。

## 参考リンク

- [SGP30 データシート][データシート]（Sensirion 公式）
- [SGP30 Driver Integration Guide][統合ガイド]（Sensirion。ベースラインの制約はこちらに記載）
- [Adafruit_SGP30](https://github.com/adafruit/Adafruit_SGP30)（移植元）

[データシート]: https://sensirion.com/media/documents/984E0DD5/61644B8B/Sensirion_Gas_Sensors_Datasheet_SGP30.pdf
[統合ガイド]: https://files.seeedstudio.com/wiki/Grove-VOC_and_eCO2_Gas_Sensor-SGP30/res/Sensirion_Gas_Sensors_SGP30_Driver-Integration-Guide_HW_I2C.pdf
