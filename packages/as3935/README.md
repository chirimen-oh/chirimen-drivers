[データシート]: https://www.sciosense.com/wp-content/uploads/documents/AS3935-Data-Sheet.pdf

# AS3935

## センサー概要
AS3935は、雷センサーICです。内蔵された雷アルゴリズムが入力信号をチェックし暴風雨の頭部までの距離を推定します。
- 製品ページ: https://www.sciosense.com/products/wireless-sensor-nodes/as3935-franklin-lightning-sensor-ic/

- I2C スレーブアドレス (要注意)
  - 0x03: 秋月電子が販売するブレークアウトボードのアドレス
  - 他に、0x00のブレークアウトボードが存在するが、使用が難しくなる

詳細な仕様は[データシート][]を参照してください。

## ブレークアウトボード
- 秋月電子通商 AE-AS3935 : [製品ページ](https://akizukidenshi.com/catalog/g/gK-08685/)
  - I2Cアドレスは0x03に設定されています。（変更不可）
  - このアドレスのデバイスをRaspberry PI のi2cdetectで検出するためには ```-a``` オプションが必要
  - ```i2cdetect -y -a 1```

## ドライバの使用例

- [こちらのリンク](https://tutorial.chirimen.org/pizero/esm-examples/#I2C_as3935) を参照ください。

