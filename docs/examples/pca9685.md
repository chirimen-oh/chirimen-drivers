{% include translate.md %}
{% include edit-on-codesandbox.md %}

# PCA9685 16 チャンネルサーボモーター PWM ドライバー

## 概要

I2C 接続の PWM ドライバー経由でサーボモーターを駆動します。（Raspberry から PWM ドライバーを I2C 接続し、 PWM ドライバとサーボモータ、外部電源を接続します。詳細は回路図を参照ください）

## 使用パーツ

- [PCA9685 搭載 16 チャネル PWM/サーボ ドライバー (I2C 接続)](https://www.switch-science.com/catalog/961/) x 1 [互換品](https://www.amazon.co.jp/s/?field-keywords=PCA9685)もあり
- [マイクロサーボ SG-90](http://akizukidenshi.com/catalog/g/gM-08761/) x 1
- ジャンパー（メス・メス）ケーブル x 4

上記に加え、外部電源確保のため下記 1. あるいは 2. が必要になります。

1. [電池 BOX(4 本用)](http://akizukidenshi.com/catalog/g/gP-03087/) x 1 (※電池 BOX を利用する場合、PCA9685 サーボドライバとの接続用に電池 BOX 側の電源ケーブルの終端をメスに加工する等の工夫が必要です)
2. 「[電源用マイクロ USB コネクタ DIP 化キット](http://akizukidenshi.com/catalog/g/gK-10972/) x 1」+「ブレッドボード x 1」「USB Micro B 端子-標準 A 端子のケーブル x 1」+「スマホ用 5V 充電器 x 1」+ 「ジャンパー（メス・オス）ケーブル x 2」
