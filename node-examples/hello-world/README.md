# @chirimen/hello-world-example

サンプルコードです。

## 開発

次のようにローカルに存在するパッケージを使って実行できます。

```sh
# このサンプルコードのソースコードをクローンします
git clone https://github.com/chirimen-oh/chirimen-drivers.git
cd chirimen-drivers
# リンクしたいパッケージのシンボリックリンクを作ります
cd packages/hello-world
npm link
# サンプルコード本体を実行します
cd ../..
cd node-examples/hello-world
node main.js
```

実行結果

```log
$ node main.js
Hello World!
```
