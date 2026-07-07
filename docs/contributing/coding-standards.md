# コーディング規約

ドライバ実装時は以下の規約に従ってください。具体例は [付録](appendix.md) の `index.js` テンプレートと [packages/adt7410/](../../packages/adt7410/) を参照してください。

## 必須

| ルール | 説明 |
| --- | --- |
| ES Modules | `package.json` に `"type": "module"` を記述 |
| クラスベース | センサードライバは ES6 クラスとして実装 |
| 非同期処理 | `async/await` を使用（`init()`, `read()` など） |
| エラーハンドリング | 未初期化時など、わかりやすいエラーメッセージを返す |
| I2C の初期化 | コンストラクタでポートとアドレスを受け取り、`init()` で `i2cPort.open()` を呼ぶ |

## 推奨

- **JSDoc**: 型情報を記述（`@param`, `@returns` など）
- **命名**: 変数名・関数名は英語で明確に
- **コメント**: 複雑なロジック（レジスタ操作など）に説明を追加
- **フォーマット**: Prettier を使用（スペース 2 個）

```bash
npx prettier --write packages/your-driver/
```

[← 目次に戻る](../../CONTRIBUTING.md)
