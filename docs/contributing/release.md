# リリース方法

> **一般のコントリビュータ向け:** PR が master にマージされると、GitHub Actions が自動的に npm へパッケージを公開します。手動でリリース作業を行う必要はありません。

以下は、バージョン管理の仕組みを理解したい方・メンテナ向けの説明です。

## バージョン管理の仕組み

各パッケージは Lerna の **independent** モードで独立したバージョン番号を持ちます（[このリポジトリのしくみ](repository.md) 参照）。バージョンの更新は、各パッケージの `package.json` を手動で編集します。

```json
{
  "name": "@chirimen/your-device-name",
  "version": "1.0.1"
}
```

## バージョニングの指針

| 種類 | 例 | いつ使うか |
| --- | --- | --- |
| PATCH | `1.0.0` → `1.0.1` | バグ修正（後方互換） |
| MINOR | `1.0.0` → `1.1.0` | 機能追加（後方互換） |
| MAJOR | `1.0.0` → `2.0.0` | 破壊的変更 |

詳細は [セマンティックバージョニング](https://semver.org/lang/ja/) を参照してください。

## 自動リリースの流れ

1. `package.json` の `version` を更新して PR をマージ
2. GitHub Actions（[.github/workflows/release.yml](../../.github/workflows/release.yml)）が起動
3. README の更新、`lerna publish from-package` の実行
4. バージョンが更新されたパッケージのみ npm に公開

## 公開の確認

`https://www.npmjs.com/package/{パッケージ名}`（例: <https://www.npmjs.com/package/@chirimen/hello-world>）

[← 目次に戻る](../../CONTRIBUTING.md)
