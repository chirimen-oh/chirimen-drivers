# @chirimen/hello-world

パッケージを作るときのサンプルコードです。

## Node.js 環境での開発

前提条件として、あらかじめ Raspberry Pi OS に Node.js をインストールしておきます。

ローカルに存在するパッケージを実行するには、次のコマンドを実行します。

```sh
# パッケージのソースコードをクローンします
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

## リリース

権限を持っており自分でリリースする場合、[リリース方法](https://chirimen.org/chirimen-drivers/CONTRIBUTING#%E3%83%AA%E3%83%AA%E3%83%BC%E3%82%B9%E6%96%B9%E6%B3%95)に沿って変更したパッケージをリリースします。

## リリース後

問題なくリリースされれば、[esm.run](https://esm.run) など CDN サービスによって自動的にホスティングされます。

参照していた部分を CDN の URL に書き換えます。

```js
import message from "https://esm.run/@chirimen/hello-world";
```

不要なファイルを取り除きます。

```sh
rm ./index.js
```

取り除きたいファイルをすでにコミットしていた場合は、Git の管理から外します。

```sh
git rm ./index.js
```
