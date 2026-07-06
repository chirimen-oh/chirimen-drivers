# このリポジトリのしくみ

このリポジトリは [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) と [Lerna](https://lerna.js.org/) で管理される **monorepo** です。複数の CHIRIMEN ドライバパッケージを一つのリポジトリで管理しています。

**monorepo とは:** 通常はパッケージごとにリポジトリを分けますが、ここでは 60 個以上のドライバを `packages/` 以下にまとめています。ルートで `npm ci` を実行すると、すべてのパッケージの依存関係が一括でインストールされます。

**パッケージの命名:** 各ドライバは `@chirimen/デバイス名` という npm パッケージ名で公開されます（例: `@chirimen/adt7410`）。ディレクトリ名はデバイス型番の小文字（例: `adt7410`, `mpu6050`）にします。

**バージョン管理:** Lerna の **independent** モードを使っており、各パッケージが独立したバージョン番号を持ちます。あるドライバだけを更新しても、他のドライバのバージョンには影響しません。

**I2C 通信:** 多くのドライバは I2C バス経由でセンサーと通信します。ブラウザや Node.js 環境では [`node-web-i2c`](https://www.npmjs.com/package/node-web-i2c) を通じて I2C にアクセスします。I2C ドライバの `package.json` には `peerDependencies` として `node-web-i2c` を指定します。

## ファイル構造

```
/
├── LICENSE
├── CONTRIBUTING.md          # コントリビュートガイド（目次）
├── docs/contributing/       # 手順別ガイド
├── README.md                # プロジェクトのトップページ
├── .github/workflows/       # GitHub Actions ワークフロー
│   ├── ci.yml               # CI (npm ci の実行)
│   └── release.yml          # リリース自動化
├── microbit-examples/       # CHIRIMEN with micro:bit 用サンプルコード
├── lerna.json               # Lerna 設定ファイル
├── package.json             # ルート package.json (workspaces 設定)
└── packages/                # ドライバモジュールのソースコード
    ├── hello-world/         # サンプルドライバ
    ├── adt7410/             # 温度センサー (ADT7410)
    │   ├── index.js         # ドライバ本体
    │   ├── package.json     # パッケージ設定
    │   └── README.md        # ドライバのドキュメント
    ├── amg8833/             # 赤外線アレイセンサー
    └── ...                  # その他60個以上のドライバ
```

[← 目次に戻る](../../CONTRIBUTING.md)
