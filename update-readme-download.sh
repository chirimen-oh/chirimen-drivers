#!/bin/bash

# READMEのDownloadセクションを自動更新するスクリプト
# packagesディレクトリのフォルダ名を取得し、アルファベット順にソートして
# README.mdの `<!-- downloads-start -->` から `<!-- downloads-stop -->` までを更新する
#
# 使用方法:
#   ./update-readme-download.sh
#
# 機能:
#   - packagesディレクトリのフォルダ名を取得
#   - chirimen、packages、hello-worldディレクトリを除外
#   - アルファベット順にソート
#   - README.mdの `<!-- downloads-start -->` 〜 `<!-- downloads-stop -->` の間のみ更新
#
# 注意:
#   - このスクリプトはプロジェクトルートディレクトリで実行してください
#   - 実行前にgitでコミットしておくことを推奨します

set -e

# 作業ディレクトリをプロジェクトルートに設定
cd "$(dirname "$0")"

START_MARKER="<!-- downloads-start -->"
STOP_MARKER="<!-- downloads-stop -->"

if ! grep -qF "$START_MARKER" README.md || ! grep -qF "$STOP_MARKER" README.md; then
    echo "README.mdに $START_MARKER / $STOP_MARKER が見つかりません。" >&2
    exit 1
fi

# packagesディレクトリのフォルダを取得し、アルファベット順にソート
# chirimen、packages、test、hello-worldディレクトリは除外
list_file=$(mktemp)
find packages -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | grep -vE '^(chirimen|hello-world)$' | sort | while read -r package; do
    echo "- [@chirimen/$package](https://www.jsdelivr.com/package/npm/@chirimen/$package)" >> "$list_file"
done

# README.mdの downloads-start 〜 downloads-stop の間のみ差し替え（それ以外は変更しない）
temp_file=$(mktemp)
awk -v start="$START_MARKER" -v stop="$STOP_MARKER" -v list_file="$list_file" '
    $0 == start {
        print
        print ""
        while ((getline line < list_file) > 0) print line
        print ""
        skip = 1
        next
    }
    $0 == stop { skip = 0 }
    !skip
' README.md > "$temp_file"

mv "$temp_file" README.md
rm -f "$list_file"

echo "README.mdのDownloadセクションを更新しました。"
