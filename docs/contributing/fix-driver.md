# 既存ドライバの修正

既存のドライバにバグ修正や機能追加を行う場合の手順です。新ドライバの追加より先に読むと、リポジトリの構造に慣れやすくなります。

## チェックリスト

- [ ] Issue を確認または作成する
- [ ] ブランチを作成する（[共通の Git ワークフロー](setup.md#共通の-git-ワークフロー)）
- [ ] `packages/<ドライバ名>/` のコードを修正する
- [ ] Prettier でフォーマットする
- [ ] `package.json` の `version` を更新する
- [ ] コミットして PR を作成する

## 手順の詳細

**1. Issue の確認**

既存の Issue がない場合は、まず [Issue](https://github.com/chirimen-oh/chirimen-drivers/issues) を作成して問題を報告します。

**2. ブランチの作成**

```bash
git checkout master
git pull upstream master
git checkout -b fix/adt7410-negative-temperature
```

**3. コードの修正とフォーマット**

```bash
# ファイルを編集（例）
vim packages/adt7410/index.js

# フォーマット
npx prettier --write packages/adt7410/
```

**4. バージョンの更新**

`packages/<ドライバ名>/package.json` の `version` を、[セマンティックバージョニング](https://semver.org/lang/ja/) に従って更新します。

| 変更の種類 | バージョンの上げ方 | 例 |
| --- | --- | --- |
| バグ修正（後方互換） | PATCH | `2.0.0` → `2.0.1` |
| 機能追加（後方互換） | MINOR | `2.0.0` → `2.1.0` |
| 破壊的変更 | MAJOR | `2.0.0` → `3.0.0` |

**5. コミットと PR**

```bash
git add packages/adt7410/
git commit -m "fix(adt7410): fix negative temperature calculation

Fixes #123"
git push origin fix/adt7410-negative-temperature
```

GitHub で Pull Request を作成します。

[← 目次に戻る](../../CONTRIBUTING.md)
