# 新しいドライバの追加

新しい I2C デバイス（GPIO・SPI デバイスも同様）のドライバを追加する手順です。

## チェックリスト

- [ ] ブランチを作成する（`feat/<デバイス名>`）
- [ ] `packages/hello-world` をコピーして新パッケージを作成する
- [ ] `package.json` / `index.js` / `README.md` を編集する
- [ ] Prettier でフォーマットする
- [ ] ルートで `npm install` して `package-lock.json` を更新する
- [ ] コミットして PR を作成する
- [ ] （推奨）[chirimen.org リポジトリ](https://github.com/chirimen-oh/chirimen.org) にサンプルコード・実体配線図・パーツ画像を追加する

## 手順の詳細

**1. ブランチの作成**

[共通の Git ワークフロー](setup.md#共通の-git-ワークフロー) に従い、`feat/<デバイス名>` という名前のブランチを作ります。

```bash
git checkout master
git pull upstream master
git checkout -b feat/example-sensor
```

**2. テンプレートからパッケージを作成**

最小構成のテンプレート [packages/hello-world/](../../packages/hello-world/) をコピーして、新しいディレクトリを作ります。ディレクトリ名はデバイス型番の小文字にします（例: `adt7410`, `mpu6050`）。

```bash
cp -r packages/hello-world packages/example-sensor
```

**3. ファイルの編集**

| ファイル       | やること                                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| `package.json` | `name`, `description`, `version`, `repository.directory` を更新。I2C ドライバなら `peerDependencies` に `node-web-i2c` を追加 |
| `index.js`     | センサーの読み取りロジックをクラスとして実装                                                                            |
| `README.md`    | 仕様・使い方・API リファレンスを記述（日本語推奨）                                                                       |

`package.json` と `index.js` のテンプレートは [付録](appendix.md) を参照してください。

**実装の参考ドライバ:**

| 難易度   | パッケージ                                    | 特徴               |
| -------- | --------------------------------------------- | ------------------ |
| 最小構成 | [packages/hello-world/](../../packages/hello-world/) | パッケージ構造の雛形 |
| シンプル | [packages/adt7410/](../../packages/adt7410/)   | I2C 温度センサー   |
| 複雑     | [packages/amg8833/](../../packages/amg8833/)   | 赤外線アレイセンサー |

**4. フォーマット**

```bash
npx prettier --write packages/example-sensor/
```

**5. package-lock.json の更新**

新パッケージを workspace に追加したため、リポジトリのルートで以下を実行します。

```bash
cd /path/to/chirimen-drivers
npm install
```

**6. コミットと PR**

```bash
git add packages/example-sensor/ package-lock.json
git commit -m "feat: add example-sensor driver"
git push origin feat/example-sensor
```

[共通の Git ワークフロー](setup.md#共通の-git-ワークフロー) に従い、GitHub で Pull Request を作成します。PR がマージされると、GitHub Actions が自動的に npm へ公開します。

**7. サンプルコードと写真の追加（推奨）**

実機での動作確認を兼ねて、[chirimen.org リポジトリ](https://github.com/chirimen-oh/chirimen.org) に CHIRIMEN 用のサンプルを追加します。初めてデバイスを使う人がすぐに試せるようになるので、動作するハードウェアがある場合はぜひ追加してください。

**7-1. サンプルコードを作成する**

[pizero/src/esm-examples/](https://github.com/chirimen-oh/chirimen.org/tree/master/pizero/src/esm-examples) 以下に新しいディレクトリを作り、既存のサンプルを参考に次の 2 ファイルを置きます。

- `main.js` — 動作するサンプルコード
- `readme.md` — 説明文。実体配線図（Fritzing）の掲載を推奨します。デバイスの Fritzing パーツが存在しない場合は、パーツコンテンツの作成も推奨します

**7-2. サンプル一覧を更新する**

[index_examples.csv](https://github.com/chirimen-oh/chirimen.org/blob/master/pizero/src/esm-examples/index_examples.csv) に、他の行を参考にレコードを 1 行追加します。

**7-3. パーツリストと写真を追加する**

- [partslist.csv](https://github.com/chirimen-oh/chirimen.org/blob/master/_data/partslist.csv) にレコードを追加します（必要カラム: パーツの型番、説明、画像ファイル名、サンプルへのリンク）
- [partsImgs/](https://github.com/chirimen-oh/chirimen.org/tree/master/partsImgs) にパーツの写真を登録します（QCIF〜QVGA 程度の小さいサイズを推奨）

[← 目次に戻る](../../CONTRIBUTING.md)
