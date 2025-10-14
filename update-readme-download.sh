#!/bin/bash

# READMEのDownloadセクションを自動更新するスクリプト
# packagesディレクトリのフォルダ名を取得し、アルファベット順にソートしてREADMEを更新
#
# 使用方法:
#   ./update-readme-download.sh
#
# 機能:
#   - packagesディレクトリのフォルダ名を取得
#   - chirimen、packages、hello-worldディレクトリを除外
#   - アルファベット順にソート
#   - README.mdのDownloadセクションを更新
#
# 注意:
#   - このスクリプトはプロジェクトルートディレクトリで実行してください
#   - 実行前にgitでコミットしておくことを推奨します

set -e

# 作業ディレクトリをプロジェクトルートに設定
cd "$(dirname "$0")"

# 一時ファイルを作成
temp_file=$(mktemp)

# packagesディレクトリからフォルダ名を取得し、アルファベット順にソート
echo "# CHIRIMEN Drivers" > "$temp_file"
echo "" >> "$temp_file"
echo "[![release](https://github.com/chirimen-oh/chirimen-drivers/actions/workflows/release.yml/badge.svg)](https://github.com/chirimen-oh/chirimen-drivers/actions/workflows/release.yml)" >> "$temp_file"
echo "" >> "$temp_file"
echo "## Download" >> "$temp_file"
echo "" >> "$temp_file"

# packagesディレクトリのフォルダを取得し、アルファベット順にソート
# chirimen、packages、test、hello-worldディレクトリは除外
find packages -maxdepth 1 -type d -name "*" | sed 's|packages/||' | grep -v "^$" | grep -v "^chirimen$" | grep -v "^packages$" | grep -v "^test$" | grep -v "^hello-world$" | sort | while read -r package; do
    echo "- [@chirimen/$package](https://www.jsdelivr.com/package/npm/@chirimen/$package)" >> "$temp_file"
done

# Usageセクション以降を追加
echo "" >> "$temp_file"
echo "## Usage" >> "$temp_file"
echo "" >> "$temp_file"
echo "### Node.js" >> "$temp_file"
echo "" >> "$temp_file"
echo '```' >> "$temp_file"
echo '$ npm i chirimen' >> "$temp_file"
echo '```' >> "$temp_file"
echo "" >> "$temp_file"
echo '```js' >> "$temp_file"
echo 'import { requestI2CAccess, ADT7410 } from "chirimen";' >> "$temp_file"
echo "" >> "$temp_file"
echo 'const i2cAccess = await requestI2CAccess();' >> "$temp_file"
echo 'const adt7410 = new ADT7410(i2cAccess.ports.get(1), 0x48);' >> "$temp_file"
echo 'await adt7410.init();' >> "$temp_file"
echo 'await adt7410.read();' >> "$temp_file"
echo '```' >> "$temp_file"
echo "" >> "$temp_file"
echo "### Deno" >> "$temp_file"
echo "" >> "$temp_file"
echo '```js' >> "$temp_file"
echo 'import { requestI2CAccess, ADT7410 } from "npm:chirimen";' >> "$temp_file"
echo '```' >> "$temp_file"
echo "" >> "$temp_file"
echo "## Documents" >> "$temp_file"
echo "" >> "$temp_file"
echo "- [CHIRIMEN Tutorial](https://r.chirimen.org/tutorial)" >> "$temp_file"
echo "- [CHIRIMEN Drivers Documentation](https://chirimen.org/chirimen-drivers/)" >> "$temp_file"
echo "- [Web I2C API](https://browserobo.github.io/WebI2C/)" >> "$temp_file"
echo "" >> "$temp_file"
echo "## [Contributing Guidelines](https://chirimen.org/chirimen-drivers/CONTRIBUTING)" >> "$temp_file"
echo "" >> "$temp_file"
echo "- [リリース方法](https://chirimen.org/chirimen-drivers/CONTRIBUTING#%E3%83%AA%E3%83%AA%E3%83%BC%E3%82%B9%E6%96%B9%E6%B3%95)" >> "$temp_file"

# 新しい内容でREADMEを更新
mv "$temp_file" README.md

echo "README.mdのDownloadセクションを更新しました。"
echo ""
