# @chirimen/hello-world

パッケージを作るときのサンプルコードです。

## CHIRIMEN for Raspberry Pi 環境での開発

次のようにローカルに存在するパッケージを使って実行できます。

サンプルコードのソースコードをクローンします。

```sh
git clone https://github.com/chirimen-oh/chirimen-drivers
cd chirimen-drivers/raspi-examples/hello-world
```

パッケージ本体を取得します。

```sh
cp ../../packages/hello-world/index.js ./index.js
```

Node.js を利用し、開発用の Web サーバーを起動します。

Node.js がインストールされていない場合、あらかじめ [Node.js をダウンロード](https://nodejs.org/ja/download/)し、インストールしておきましょう。

Node.js がインストールされ準備が整えば、次のコマンドを実行すると、開発用の Web サーバーが起動します。

```sh
npx serve
```

ブラウザーからアクセスし、問題なく表示されていれば成功です。

### 変更の反映

パッケージ本体に変更を反映させます。

```sh
cp ./index.js ../../packages/hello-world/index.js
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

## Node.js 環境での開発

前提条件として、あらかじめ Raspberry Pi OS に Node.js をインストールしておきます。

ローカルに存在するパッケージを実行するには、次のコマンドを実行します。

```sh
# パッケージのソースコードをクローンします
git clone https://github.com/chirimen-oh/chirimen-drivers.git
cd chirimen-drivers/packages/hello-world
# パッケージのシンボリックリンクを作ります
yarn link
# サンプルコードの存在するディレクトリに移動します
cd ../../node-examples/hello-world
# シンボリックリンクを作ったパッケージにリンクします
yarn link @chirimen/hello-world
# サンプルコード本体を実行します
yarn exec node --input-type=module main.js
```

ここでは [Yarn](https://classic.yarnpkg.com/) を使用しましたが [npm](https://www.npmjs.com/) でも [`npm link`](https://docs.npmjs.com/cli/v6/commands/npm-link) を使って同様に実行できると思います。

実行結果

```log
$ yarn exec node --input-type=module main.js
yarn exec v1.22.5
Hello World!
✨  Done in 0.11s.
```
