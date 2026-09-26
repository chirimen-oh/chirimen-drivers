# 既存 driver の変更

既存 package の bug fix と機能変更。正は [docs/contributing/fix-driver.md](../../../../docs/contributing/fix-driver.md)。変更は依頼された package に限定する。リリース判断は始めない。

## Bug fix と機能変更

利用者から見える振る舞いで分ける。

| 種別 | 判断 | version |
| --- | --- | --- |
| bug fix | 公開 API はそのままで、期待と違う動作を直す | PATCH（`2.0.0` → `2.0.1`） |
| 既存 driver の変更 | 新しい操作を足す、または互換のある振る舞い変更 | MINOR（`2.0.0` → `2.1.0`） |
| 破壊的変更 | 既存の呼び出しや戻り値の意味が変わる | MAJOR（`2.0.0` → `3.0.0`） |

bug fix では、再現条件、期待する動作、実際の動作を確認してから直す。新しいメソッドを足す作業は bug fix にしない。

## API compatibility

互換を保つ変更は、既存の public メソッドの引数、戻り値、呼び出す順序を変えない。未初期化時のエラーも、呼び出し側が依存している文言を不用意に変えない。

互換を壊すときは MAJOR を上げ、README の呼び出し例を新しい API に合わせる。互換を保ったまま別メソッドを足すなら MINOR で足りる。

## Documentation

振る舞い、引数、戻り値、エラー条件が変わるときは、その package の README を同じ変更で更新する。説明だけの誤りを直す場合は、コードの version を上げる必要はない。

## Version を上げる前の確認

`packages/<device>/package.json` の `version` だけを更新する。Lerna は independent なので、他の package やルートの version は触らない。

- 対象は依頼された package か
- 上げ幅は PATCH、MINOR、MAJOR のどれか
- README は、変わった振る舞いに追いついているか
- 無関係な package の差分が混ざっていないか

ブランチ名は bug fix なら `fix/<device>-<内容>`、機能追加なら `feat/<device>-<内容>`。コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org/) に従う。
