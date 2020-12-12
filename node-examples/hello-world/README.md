# @chirimen/hello-world-example

パッケージを作るときのサンプルコードです。

## 開発

次のようにローカルに存在するパッケージを使って実行できます。

```sh
# このサンプルコードのソースコードをクローンします
git clone https://github.com/chirimen-oh/chirimen-drivers.git
cd chirimen-drivers/node-examples/hello-world
# リンクしたいパッケージのシンボリックリンクを作ります
yarn --cwd ../../packages/hello-world link
# シンボリックリンクを作ったパッケージにリンクします
yarn link @chirimen/hello-world
# サンプルコード本体を実行します
yarn exec node main.mjs
```

ここでは [Yarn](https://classic.yarnpkg.com/) を使用しましたが [npm](https://www.npmjs.com/) でも [`npm link`](https://docs.npmjs.com/cli/v6/commands/npm-link) を使って同様に実行できます。

実行結果

```log
$ yarn exec node main.mjs
yarn exec v1.22.5
Hello World!
✨  Done in 0.11s.
```
