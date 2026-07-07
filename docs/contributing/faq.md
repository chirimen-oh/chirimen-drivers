# よくある質問

## Q1. 新しいパッケージを追加したのに npm に公開されない

以下を確認してください:

1. `package.json` の `name` が `@chirimen/` で始まっているか
2. `publishConfig.access` が `"public"` に設定されているか
3. `version` が `1.0.0` など正しく設定されているか
4. PR が master にマージされているか
5. [GitHub Actions のログ](https://github.com/chirimen-oh/chirimen-drivers/actions) にエラーがないか

## Q2. monorepo の依存関係はどう管理するか

ルートディレクトリで `npm ci` を実行すれば、すべての workspace パッケージの依存関係が一括でインストールされます。

## Q3. Lerna のコマンドを使う必要があるか

通常の開発では不要です。リリースは GitHub Actions が自動的に行います。

## Q4. 既存のドライバを参考にしたい

[新しいドライバの追加](add-driver.md) の「実装の参考ドライバ」を参照してください。最小構成は `hello-world`、I2C センサーは `adt7410`、複雑な例は `amg8833` です。

## Q5. I2C 以外のデバイス（GPIO、SPI など）のドライバも追加できるか

はい、可能です。主に I2C デバイスを扱っていますが、GPIO や SPI のドライバも歓迎します。

## Q6. ドキュメントは日本語で書くべきか

README は日本語推奨です。コード内コメントやコミットメッセージは英語・日本語どちらでも構いません。

## 質問・相談

不明点があれば、お気軽に [Issue](https://github.com/chirimen-oh/chirimen-drivers/issues) を作成してください。どのガイドを読めばよいかわからない場合は、[はじめに・基本ルール](getting-started.md) から始めてください。

## 参考リンク

- [CHIRIMEN 公式サイト](https://chirimen.org/)
- [npm workspaces ドキュメント](https://docs.npmjs.com/cli/using-npm/workspaces)
- [Lerna ドキュメント](https://lerna.js.org/)
- [セマンティックバージョニング](https://semver.org/lang/ja/)

[← 目次に戻る](../../CONTRIBUTING.md)
