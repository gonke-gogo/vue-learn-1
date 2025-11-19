#!/bin/bash

# .nvmrcファイルからNode.jsのバージョンを読み込んで切り替え
if [ -f .nvmrc ]; then
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm use
fi

# 開発サーバーを起動（直接nuxt devを実行）
npx nuxt dev

