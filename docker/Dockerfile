FROM node:20-alpine

# 作業ディレクトリ
WORKDIR /app

# 開発ツールのインストール
RUN apk add --no-cache \
    git \
    bash

# グローバルパッケージのインストール
RUN npm install -g @google/clasp

# ユーザー作成（セキュリティのため非rootユーザーで実行）
RUN addgroup appuser && \
    adduser -D -G appuser appuser && \
    chown -R appuser:appuser /app

# 非rootユーザーに切り替え
USER appuser

# デフォルトコマンド
CMD ["sh"]
