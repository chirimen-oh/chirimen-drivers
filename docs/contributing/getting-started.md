# はじめに・基本ルール

## 貢献の種類と手順の選び方

[CONTRIBUTING.md のフローチャート](../../CONTRIBUTING.md#ガイドの選び方) で全体の流れを確認できます。やりたいことに合わせて、読むべきガイドを選んでください。

| やりたいこと | 読むガイド | 難易度 |
| --- | --- | --- |
| 誤字・文言の修正（Git 不要） | [初めての貢献](first-contribution.md) の GitHub UI 編集 | 初級 |
| ドキュメント修正（Git 使用） | [セットアップ](setup.md) → [初めての貢献](first-contribution.md) | 初級 |
| 既存ドライバのバグ修正・機能追加 | [セットアップ](setup.md) → [既存ドライバの修正](fix-driver.md) | 中級 |
| 新しいドライバの追加 | [セットアップ](setup.md) → [新しいドライバの追加](add-driver.md) | 中級〜上級 |
| npm への公開・リリース（メンテナ向け） | [リリース方法](release.md) | 上級 |

初めてコントリビュートする方は、まず小さなドキュメント修正から Pull Request を送ると、フォーク・ブランチ・PR の流れを体験できます。

## 行動規範

[コントリビューター行動規範 - Contributor Covenant](https://www.contributor-covenant.org/ja/version/1/4/code-of-conduct)

行動規範に反するコントリビュートは受け入れません。

## Issues と Pull Request

### Issues

質問、バグ、提案、その他 Issue を歓迎します。

- **バグ報告**: 再現手順、期待する動作、実際の動作を記載してください
- **機能提案**: 具体的なユースケースと共に提案してください
- **質問**: 遠慮なくお尋ねください

### Pull Request

ドキュメント追加、モジュール追加、バグ修正、その他改善するための Pull Request を歓迎します。

**PR を送るときの基本ルール:**

- ブランチ名は `type/short-description` 形式（例: `docs/fix-readme-typo`, `feat/example-sensor`）
- コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org/) に準拠（`feat:`, `fix:`, `docs:` など）
- 変更内容と動作確認の結果を PR 説明に記載してください

詳細は [セットアップ](setup.md#共通の-git-ワークフロー) の「共通の Git ワークフロー」を参照してください。

[← 目次に戻る](../../CONTRIBUTING.md)
