# 初めての貢献：ドキュメント修正

誤字や文言の変更など、軽微なドキュメント修正から始めるのがおすすめです。

## チェックリスト

- [ ] 修正対象のファイルを特定する
- [ ] 変更を加える（GitHub UI または Git）
- [ ] Pull Request を作成する

## 方法 A: GitHub 上で直接編集（Git 不要）

1. 修正したいファイルを GitHub で開く
2. 右上の鉛筆アイコン（Edit this file）をクリック
3. 変更を加える
4. 下部の「Propose changes」をクリック
5. 「Create pull request」をクリック

詳しくは [リポジトリのファイルを編集する](https://help.github.com/ja/github/managing-files-in-a-repository/editing-files-in-your-repository) を参照してください。

## 方法 B: Git を使う

[共通の Git ワークフロー](setup.md#共通の-git-ワークフロー) に従い、以下の例のように進めます。

```bash
git checkout -b docs/fix-readme-typo
# ファイルを編集
git add README.md
git commit -m "docs: fix typo in README"
git push origin docs/fix-readme-typo
# GitHub で Pull Request を作成
```

[← 目次に戻る](../../CONTRIBUTING.md)
