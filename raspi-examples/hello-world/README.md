# @chirimen/hello-world-example

パッケージを作るときのサンプルコードです。

## 開発

次のようにローカルに存在するパッケージを使って実行できます。

このサンプルコードのソースコードをクローンします。

```sh
git clone https://github.com/chirimen-oh/chirimen-drivers
cd chirimen-drivers/raspi-examples/hello-world
```

パッケージ本体を取得します。

```sh
cp ../../packages/hello-world/index.mjs ./index.mjs
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
cp ./index.mjs ../../packages/hello-world/index.mjs
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
rm ./index.mjs
```

取り除きたいファイルをすでにコミットしていた場合は、Git の管理から外します。

```sh
git rm ./index.mjs
```
