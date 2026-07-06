# 新しいドライバの追加

新しい I2C デバイス（や GPIO・SPI デバイス）のドライバを追加する手順です。

## チェックリスト

- [ ] ブランチを作成する（`feat/<デバイス名>`）
- [ ] `packages/hello-world` をコピーして新パッケージを作成する
- [ ] `package.json` / `index.js` / `README.md` を編集する
- [ ] Prettier でフォーマットする
- [ ] （任意）ハードウェアで動作確認する
- [ ] ルートで `npm install` して `package-lock.json` を更新する
- [ ] コミットして PR を作成する

## 手順の詳細

**1. ブランチの作成**

[共通の Git ワークフロー](setup.md#共通の-git-ワークフロー) に従い、ブランチ名は `feat/<デバイス名>` とします。

```bash
git checkout master
git pull upstream master
git checkout -b feat/example-sensor
```

**2. テンプレートからパッケージを作成**

[packages/hello-world/](../../packages/hello-world/) が最小構成のテンプレートです。これをコピーして新しいディレクトリを作ります。

```bash
cp -r packages/hello-world packages/example-sensor
```

ディレクトリ名はデバイス型番の小文字（例: `adt7410`, `mpu6050`）にします。

**3. ファイルの編集**

| ファイル | やること |
| --- | --- |
| `package.json` | `name`, `description`, `version`, `repository.directory` を更新。I2C ドライバなら `peerDependencies` に `node-web-i2c` を追加 |
| `index.js` | センサーの読み取りロジックをクラスとして実装 |
| `README.md` | 仕様・使い方・API リファレンスを記述（日本語推奨） |

`package.json` と `index.js` のテンプレートは [付録](appendix.md) を参照してください。

**実装の参考ドライバ:**

| 難易度 | パッケージ | 特徴 |
| --- | --- | --- |
| 最小構成 | [packages/hello-world/](../../packages/hello-world/) | パッケージ構造の雛形 |
| シンプル | [packages/adt7410/](../../packages/adt7410/) | I2C 温度センサー |
| 複雑 | [packages/amg8833/](../../packages/amg8833/) | 赤外線アレイセンサー |

**4. フォーマット**

```bash
npx prettier --write packages/example-sensor/
```

**5. 動作確認（任意）**

ハードウェアがある場合、ローカルパッケージを直接インストールして確認できます。

```bash
mkdir tmp-check && cd tmp-check
npm init -y
npm install ../packages/example-sensor node-web-i2c
```

`tmp-check/package.json` に `"type": "module"` を追記し、サンプルコードを実行します。確認後は `tmp-check/` を削除してください（コミット不要）。

**6. package-lock.json の更新**

新パッケージを workspace に追加したため、ルートで以下を実行します。

```bash
cd /path/to/chirimen-drivers
npm install
```

**7. コミットと PR**

```bash
git add packages/example-sensor/ package-lock.json
git commit -m "feat: add example-sensor driver"
git push origin feat/example-sensor
```

[共通の Git ワークフロー](setup.md#共通の-git-ワークフロー) に従い、GitHub で Pull Request を作成します。PR がマージされると、GitHub Actions が自動的に npm へ公開します。

[← 目次に戻る](../../CONTRIBUTING.md)
