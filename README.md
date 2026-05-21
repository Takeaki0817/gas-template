# Google Apps Script プロジェクトテンプレート

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Jest](https://img.shields.io/badge/Jest-29.7+-green.svg)](https://jestjs.io/)
[![Docker](https://img.shields.io/badge/Docker-ready-blue.svg)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScript + clasp + Jest + Docker による、モダンな Google Apps Script 開発環境のテンプレートです。

---

## ⚠️ 直接編集禁止

このテンプレートから派生させたプロジェクトは **GitHub リポジトリで管理する前提**です。Apps Script Web エディタで直接コードを編集しないでください。次回 `npm run push` で上書きされて変更が失われます。

変更は必ずローカルの `src/` で行い、`npm run build && npx clasp push`（または `npm run push`）でデプロイしてください。

---

## テンプレートとして使う場合の書き換え箇所

このリポジトリを clone して新しい GAS プロジェクトを作る場合、以下を新プロジェクト向けに書き換えてください。

### 必須

| ファイル | 書き換える箇所 |
|---|---|
| `package.json` | `name` / `description` / `author` / `keywords` |
| `README.md` | 1 行目のタイトル、リポジトリ URL（`gh repo create` で生成される URL）、プロジェクト固有説明、この「直接編集禁止」より上のセクション全て |
| `src/config/settings.ts` | `appName` / `version` / `environment` |
| `.clasp.json`（新規作成） | `npx clasp create ...` で生成、または既存 GAS の `scriptId` を設定 |
| `LICENSE` / `package.json` の `license` | MIT を引き継がない場合は変更 |

### 必要に応じて

| ファイル | 書き換える箇所 |
|---|---|
| `appsscript.json` | `timeZone`（Asia/Tokyo 以外）、`oauthScopes`（使う API に応じ追加・削除） |
| `CLAUDE.md` | Project Overview / Architecture / Commands のプロジェクト固有部分 |
| `.env.example` | そのプロジェクトで使う Script Properties キー一覧に差し替え |
| `.github/workflows/ci.yml` | デプロイジョブ追加（`CLASP_CREDENTIALS` シークレットを別途登録） |
| `.claude/skills/gas-best-practices/SKILL.md` | プロジェクト固有のアンチパターンを追記 |

### 引き継いで使うもの（書き換え不要）

- `src/lib/` 配下のヘルパー（errors / logger / secrets / db / long-running / utils）
- `src/handlers/` のスケルトン（処理を追加するだけ）
- `__tests__/mocks/gas-mocks.ts` の GAS API モック
- `.claude/rules/*.md`（gas-source.md / testing.md）
- `eslint.config.js` / `.prettierrc.json` / `jest.config.js` / `tsconfig.json`
- `skills-lock.json`（外部スキルの固定バージョン）

### このテンプレート自体への変更（PR を本リポジトリへ送る場合）

- このリポジトリ（`Takeaki0817/gas-template`）に直接 PR を送る場合のみ、上記の書き換えは不要です
- 自分用にフォークして使う場合は、最初にフォーク先のリポジトリ URL に置き換えてください

---

## 目次

- [3 分でスタート](#3-分でスタート)
- [Prerequisites（前提条件）](#prerequisites前提条件)
- [このプロジェクトについて](#このプロジェクトについて)
- [使用技術](#使用技術)
- [ディレクトリ構造](#ディレクトリ構造)
- [PropertiesService セットアップ](#propertiesservice-セットアップ)
- [Cloud SQL / JDBC 接続](#cloud-sql--jdbc-接続)
- [長時間処理（継続トリガー）](#長時間処理継続トリガー)
- [エラーハンドリング](#エラーハンドリング)
- [構造化ロガー](#構造化ロガー)
- [テスト戦略](#テスト戦略)
- [開発フロー](#開発フロー)
- [コマンド一覧](#コマンド一覧)
- [Agent Skills](#agent-skills)
- [チュートリアル](#チュートリアル)
- [FAQ](#faq)
- [トラブルシューティング](#トラブルシューティング)
- [詳細なセットアップ手順](#詳細なセットアップ手順)
- [CI（GitHub Actions）](#cigithub-actions)
- [カスタマイズ](#カスタマイズ)
- [参考リンク](#参考リンク)

---

## 3 分でスタート

このテンプレートを使って、すぐに GAS 開発を始められます。

```bash
# 1. テンプレートをコピー
cp -r gas-template my-project && cd my-project

# 2. 依存をインストール
npm install

# 3. 認証 & プロジェクト作成
npx clasp login
npx clasp create --title "My Project" --type standalone --rootDir ./dist
```

✅ 続きは [開発フロー](#開発フロー) と [コマンド一覧](#コマンド一覧) へ。

---

## Prerequisites（前提条件）

| 項目 | 要件 |
|---|---|
| Node.js | **20.x** 以上（Dockerfile / CI も Node 20 想定） |
| npm | Node に同梱のもので OK |
| Google アカウント | clasp 認証および Apps Script API の有効化に必要 |
| Apps Script API | https://script.google.com/home/usersettings で「Google Apps Script API」を ON にする |
| Docker（任意） | チーム開発で環境を統一したい場合のみ。ローカル Node でも開発可能 |

### 初回認証

```bash
npx clasp login
```

ブラウザが開くので Google アカウントでログインしてください。

> **注意**: Apps Script API が無効だと `User has not enabled the Apps Script API` で失敗します。上記の URL から有効化してください。

---

## このプロジェクトについて

### 通常の GAS 開発との違い

|                    | 通常の GAS 開発 | このテンプレート |
| ------------------ | --------------- | ---------------- |
| エディタ           | ブラウザのみ    | VSCode など自由  |
| バージョン管理     | ❌ 難しい       | ✅ Git で管理    |
| テスト             | ❌ できない     | ✅ 自動テスト    |
| チーム開発         | ❌ しづらい     | ✅ 効率的に可能  |
| 型チェック         | ❌ なし         | ✅ TypeScript    |

### ビルドパイプライン

```
src/*.ts → esbuild（esbuild-gas-plugin） → dist/Code.js → clasp push → GAS
```

---

## 使用技術

| 技術 | 役割 | 学習リソース |
|------|------|------|
| **TypeScript** 5.3+ | 型安全な開発、ES2019 / V8 互換 | [公式ハンドブック（日本語）](https://www.typescriptlang.org/ja/docs/) |
| **clasp** 2.4+ | ローカルと GAS の同期・認証 | [clasp 公式](https://developers.google.com/apps-script/guides/clasp) |
| **Jest** 29.7+ | ユニットテスト + カバレッジ | [Jest 公式（日本語）](https://jestjs.io/ja/) |
| **esbuild** | 高速バンドラ（src → dist/Code.js） | [esbuild 公式](https://esbuild.github.io/) |
| **Docker**（任意） | チーム間の環境統一 | [Docker 公式](https://www.docker.com/) |
| **ESLint / Prettier** | 静的解析・フォーマット | — |

TypeScript / Jest を初めて使う方向けの簡易な説明:

- **TypeScript**: JavaScript に「型」を足した言語。エディタが補完で助けてくれて、実行前にバグを検知できる。
- **clasp**: ブラウザの GAS エディタの代わりに、VSCode などローカル環境で書いたコードを GAS に同期するための CLI。
- **Jest**: 「この関数は X を入れたら Y を返すはず」というテストを書いて自動実行する。リファクタの安全網。
- **esbuild**: TypeScript を GAS が読める JavaScript に高速変換する内部ツール。`npm run build` で自動的に動く。

---

## ディレクトリ構造

```
gas-template/
├─ src/                       ← あなたが書く GAS コード
│  ├─ main.ts                 ← エントリーポイント（global.* で登録）
│  ├─ config/
│  │  └─ settings.ts          ← 静的 config + PropertiesService ヘルパー
│  ├─ lib/                    ← 共通モジュール
│  │  ├─ errors.ts            ← AppError 階層
│  │  ├─ logger.ts            ← 構造化ロガー（シークレットレダクション付き）
│  │  ├─ secrets.ts           ← Script Properties キャッシュアクセス
│  │  ├─ db.ts                ← JDBC ヘルパー（withConnection 等）
│  │  ├─ long-running.ts      ← 6 分制限回避（runWithContinuation）
│  │  └─ utils.ts             ← 汎用ユーティリティ
│  ├─ handlers/               ← GAS エントリポイント実装
│  │  ├─ http.ts              ← doGet / doPost
│  │  └─ scheduled.ts         ← 時間トリガー実装
│  └─ types/
│     └─ global.d.ts          ← AppConfig / LogLevel / global 型
├─ __tests__/                 ← Jest テスト
│  ├─ setup.ts                ← TZ=Asia/Tokyo、GAS モック登録
│  ├─ mocks/gas-mocks.ts      ← GAS API モック実装
│  └─ unit/                   ← src/ をミラーした単体テスト
├─ dist/                      ← ビルド出力（自動生成 / 触らない）
├─ coverage/                  ← カバレッジ出力（自動生成 / 触らない）
├─ docker/                    ← Dockerfile 一式
├─ .github/workflows/ci.yml   ← CI（lint / test / build / coverage upload）
├─ .env.example               ← Script Properties キーのテンプレート
├─ .prettierrc.json
├─ eslint.config.js
├─ appsscript.json            ← GAS ランタイム設定（V8 / TZ / OAuth スコープ）
├─ esbuild.config.js          ← ビルド設定（基本触らない）
├─ jest.config.js
├─ tsconfig.json
├─ package.json
└─ .clasp.json                ← GAS 接続情報（コミットしない）
```

---

## PropertiesService セットアップ

GAS では `.env` ファイルではなく **Script Properties** に設定値を入れます。本テンプレートのコードは `src/lib/secrets.ts` の `Secrets` クラス経由でアクセスします（実行中はキャッシュされます）。

### 登録手順

1. `npm run open` で GAS エディタを開く
2. 「プロジェクトの設定」→「スクリプト プロパティ」
3. 「スクリプト プロパティを追加」で必要なキー・値を登録

### 主要キー一覧（`.env.example` に対応）

| キー | 必須 | 用途 | 例 |
|---|---|---|---|
| `LOG_LEVEL` | 任意 | ログレベル（debug / info / warn / error） | `info` |
| `LOG_SHEET_NAME` | 任意 | ログ書き込み先のシート名（省略時はシート出力なし） | `Logs` |
| `APP_ENV` | 任意 | 環境識別子 | `production` |
| `CONNECTION_NAME` | DB 接続時 | Cloud SQL 接続文字列 | `jdbc:google:mysql://...` |
| `DB_USER` | DB 接続時 | DB ユーザー名 | — |
| `DB_PASSWORD` | DB 接続時 | DB パスワード | — |
| `DB_NAME` | DB 接続時 | デフォルトデータベース名 | — |

### コード例

```typescript
import { Secrets } from './lib/secrets';

// 必須キー（なければ MissingSecretError）
const dbUser = Secrets.getRequired('DB_USER');

// 型変換付き
const apiTimeout = Secrets.getRequired('API_TIMEOUT', Number); // => number

// オプショナル（なければデフォルト値）
const logLevel = Secrets.getOptional('LOG_LEVEL', 'info');

// 起動時に一括バリデーション（最初に欠けているキーで MissingSecretError）
Secrets.validateAll(['DB_USER', 'DB_PASSWORD', 'DB_NAME']);
```

---

## Cloud SQL / JDBC 接続

`src/lib/db.ts` は GAS の JDBC サービスを薄くラップし、接続管理・クエリ実行・後片付けを担います。`withConnection` は処理が成功しても例外でも必ず接続をクローズします。

```typescript
import { withConnection, executeQuery, listTables } from './lib/db';
import { Secrets } from './lib/secrets';

const config = {
  url: Secrets.getRequired('CONNECTION_NAME'),
  user: Secrets.getRequired('DB_USER'),
  password: Secrets.getRequired('DB_PASSWORD'),
};

// 接続を開いてクエリを実行し、自動でクローズ
const rows = withConnection(config, (conn) =>
  executeQuery(conn, 'SELECT * FROM users WHERE status = ?', ['active'])
);

// テーブル一覧
const tables = withConnection(config, (conn) =>
  listTables(conn, Secrets.getRequired('DB_NAME'))
);
```

接続パラメータは引数で渡し、コード中にベタ書きしないでください。

---

## 長時間処理（継続トリガー）

GAS の 1 回の実行時間は **6 分** に制限されています。`src/lib/long-running.ts` の `runWithContinuation` を使うと、処理を途中で中断して時間トリガーから自動再開できます。

```typescript
import { runWithContinuation } from './lib/long-running';

function syncAllUsers(): void {
  const users = fetchAllUserIds(); // string[] など
  runWithContinuation('syncAllUsers', users, (user) => {
    processUser(user);
  }, { maxExecMs: 5 * 60 * 1000 });
}

declare const global: { syncAllUsers: typeof syncAllUsers };
global.syncAllUsers = syncAllUsers;
```

### 引数

- `jobName: string` — PropertiesService の状態キー、およびデフォルトのトリガー関数名
- `items: T[]` — 処理対象の配列。残りインデックスと一緒に PropertiesService に保存される
- `processItem: (item: T) => void` — 各要素を処理する関数
- `options.maxExecMs?: number` — 1 回の実行で使う上限ミリ秒（デフォルト 5 分）
- `options.triggerFunctionName?: string` — 継続トリガーが呼び出す関数名（省略時は `jobName`）

> ⚠️ **OAuth スコープ**: `https://www.googleapis.com/auth/script.scriptapp` が必要です（`appsscript.json` に登録済み）。

---

## エラーハンドリング

`src/lib/errors.ts` には `AppError` を基底クラスとした階層があります。

| クラス | code | 用途 |
|---|---|---|
| `MissingSecretError` | `MISSING_SECRET` | Script Property が存在しない |
| `DbConnectionError` | `DB_CONNECTION_ERROR` | DB 接続・クエリエラー |
| `SheetNotFoundError` | `SHEET_NOT_FOUND` | スプレッドシートのシートが見つからない |
| `RetriableError` | `RETRIABLE_ERROR` | リトライ可能な一時的エラー |

```typescript
import { AppError } from './lib/errors';
import { getLogger } from './lib/logger';

const logger = getLogger('myModule');

try {
  // ... 処理 ...
} catch (error) {
  if (error instanceof AppError) {
    logger.error('処理失敗', error.serialize());
  } else {
    logger.error('予期しないエラー', { message: String(error) });
  }
}
```

---

## 構造化ロガー

`src/lib/logger.ts` は JSON 1 行形式の構造化ロガーです。Script Property `LOG_LEVEL` でフィルタリングし、`LOG_SHEET_NAME` を設定するとスプレッドシートにも書き込みます。

```typescript
import { getLogger } from './lib/logger';
const logger = getLogger('moduleName');
logger.info('user logged in', { userId: 'u1' });
```

### シークレットレダクション

`password`、`token`、`api_key`、`authorization`、`secret`、`credential` などのキーは context 内で自動的に `***` に置換されます。ネストされたオブジェクト・配列も再帰的に処理されます。シークレットを誤ってログに出す事故を防ぐためのセーフネットです。

```typescript
logger.info('login', { userId: 'u1', password: 'p@ss', token: 'abc' });
// → context: { userId: 'u1', password: '***', token: '***' }
```

---

## テスト戦略

### GAS モック

GAS API（`PropertiesService`、`Jdbc`、`SpreadsheetApp`、`UrlFetchApp` 等）は `__tests__/mocks/gas-mocks.ts` でモック化し、`__tests__/setup.ts` でグローバル登録されます。テストは Node.js 環境で動きますが、GAS API が透過的に使えます。

各テストの `beforeEach` ではモック状態をリセットします（基本は `jest.clearAllMocks()` + `Secrets.clearCache()`）。

### カバレッジ目標

- 全指標（statements / branches / functions / lines）で **70%** 以上
- `src/main.ts` および `src/handlers/**/*.ts`（GAS エントリポイント）は集計から除外
- `npm run test:coverage` でレポートを確認

---

## 開発フロー

```
[1] コード編集 (src/*.ts)
       ↓
[2] テスト (npm test)
       ↓
[3] ビルド (npm run build)  ← src/*.ts → dist/Code.js
       ↓
[4] プッシュ (npm run push)  ← clasp push で GAS へ
       ↓
[5] 動作確認 (npm run open)  ← GAS エディタで実行
```

### 推奨パターン: watch 2 枚

```bash
# ターミナル 1
npm run watch        # ファイル変更を監視して自動ビルド

# ターミナル 2
npm run test:watch   # ファイル変更でテスト自動実行
```

---

## コマンド一覧

### ビルド・デプロイ

| コマンド | 説明 |
|---|---|
| `npm run build` | `src/` を `dist/Code.js` にバンドル |
| `npm run watch` | ビルドのファイル監視モード |
| `npm run push` | ビルド + clasp push |
| `npm run deploy` | ビルド + push + clasp deploy |
| `npm run open` | GAS エディタをブラウザで開く |

### テスト・品質

| コマンド | 説明 |
|---|---|
| `npm test` | Jest を 1 度実行 |
| `npm run test:watch` | Jest の監視モード |
| `npm run test:coverage` | カバレッジレポート付き |
| `npm run lint` | ESLint で `src/` と `__tests__/` をチェック |
| `npm run format` | Prettier で TS ファイルを整形 |

### Docker（任意）

| コマンド | 説明 |
|---|---|
| `npm run docker:build` | Docker イメージをビルド |
| `npm run docker:test` | コンテナ内でテスト実行 |
| `npm run docker:dev` | コンテナ内で watch モード起動 |
| `npm run docker:shell` | コンテナ内で対話シェル |

---

## Agent Skills

このテンプレートは **[Agent Skills](https://skills.sh/)** を活用して、Claude Code / Codex などの AI コーディング支援エージェントに GAS / TypeScript の品質知識を渡します。スキルはエージェントが必要に応じて自動参照する markdown 文書です。

### インストール済みスキル

| スキル | 対象 | 役割 |
|---|---|---|
| `gas-best-practices`（本リポジトリ自前） | claude-code / codex | GAS 公式ベストプラクティス + アンチパターン早見表 + 本テンプレ実装との対応 |
| [`typescript-best-practices`](https://skills.sh/0xbigboss/claude-code/typescript-best-practices) | claude-code / codex | TypeScript の型システム・関数型・エラーハンドリング |
| [`javascript-typescript-jest`](https://skills.sh/github/awesome-copilot/javascript-typescript-jest) | claude-code / codex | Jest テスト記述パターン |

### ディレクトリ配置

```
.claude/skills/
├─ gas-best-practices/           ← 本リポジトリ自前
├─ typescript-best-practices/    → symlink (.agents/skills/...)
└─ javascript-typescript-jest/   → symlink (.agents/skills/...)
.agents/skills/                  ← 外部スキルの実体（universal / Codex 向け）
skills-lock.json                 ← バージョン固定（コミット対象）
```

### 新規 clone 後の復元

```bash
npx skills experimental_install   # skills-lock.json からスキルを復元
```

### スキルの追加・削除・更新

```bash
# 検索（対話的）
npx skills find <keyword>

# 追加（claude-code と codex の両方に symlink インストール）
npx skills add <owner/repo@skill-name> -a claude-code -a codex -y

# 削除
npx skills remove <skill-name> -a claude-code -a codex -y

# 一覧・更新
npx skills ls
npx skills update
```

### 自前スキルの編集

`.claude/skills/gas-best-practices/SKILL.md` を編集してください。frontmatter の `description` を分かりやすく書くことが重要（エージェントはこの説明文を見て発火判断します）。

---

## チュートリアル

### Tutorial: 関数を作って GAS にデプロイする（15 分）

**1. 関数を書く** — `src/greeting.ts` を新規作成:

```typescript
/**
 * 名前から挨拶メッセージを生成
 */
export function greet(name: string): string {
  return `こんにちは、${name}さん！`;
}
```

**2. テストを書く** — `__tests__/unit/greeting.test.ts`:

```typescript
import { greet } from '../../src/greeting';

describe('greet', () => {
  it('名前を含む挨拶を返す', () => {
    expect(greet('太郎')).toBe('こんにちは、太郎さん！');
  });
});
```

**3. main.ts でグローバル登録** — GAS から呼べるように:

```typescript
import { greet } from './greeting';

function testGreeting(): void {
  Logger.log(greet('Taro'));
}

declare const global: { testGreeting: typeof testGreeting };
global.testGreeting = testGreeting;
```

**4. テスト → ビルド → プッシュ**:

```bash
npm test
npm run push
npm run open   # GAS エディタで testGreeting を実行
```

---

## FAQ

<details>
<summary><strong>Q. Node.js は何バージョン？</strong></summary>

Node 20.x を推奨。Dockerfile も CI も 20 系を使っています。
</details>

<details>
<summary><strong>Q. TypeScript がわからなくても使える？</strong></summary>

サンプルをコピーする / 既存コードを少し直す程度なら問題ありません。新規機能を書くなら [TypeScript ハンドブック](https://www.typescriptlang.org/ja/docs/) や [サバイバル TypeScript](https://typescriptbook.jp/) で基礎を一読してください。
</details>

<details>
<summary><strong>Q. テストは必須？</strong></summary>

オプションです。`npm run build && npm run push` だけで運用も可能。ただし、`src/lib/` の共通モジュールに手を入れるならテストの追加を強く推奨します。
</details>

<details>
<summary><strong>Q. Docker は必須？</strong></summary>

オプションです。Node がローカルに入っていれば不要。チームで環境を揃えたい場合のみ使ってください。
</details>

<details>
<summary><strong>Q. 既存の GAS プロジェクトを移行できる？</strong></summary>

`npx clasp clone <SCRIPT_ID> --rootDir ./dist` で既存スクリプトを取り込み、`dist/` の JS を `src/*.ts` に書き直して TypeScript 化します。
</details>

---

## トラブルシューティング

### `User has not enabled the Apps Script API`

Apps Script API が無効です。https://script.google.com/home/usersettings を開いて ON にし、`npx clasp login` で再認証してください。

### `clasp: command not found`

このテンプレートは `npx clasp` または `npm run open` を前提にしているのでグローバルインストールは不要です。`npx clasp login` のように `npx` を付けて実行してください。

### テストが失敗する

```bash
npx jest --clearCache
rm -rf node_modules package-lock.json && npm install
npx tsc --noEmit
```

### ビルドエラー

```bash
npx tsc --noEmit    # 型エラー詳細を確認
```

### Docker 環境のリセット

```bash
docker-compose build --no-cache
docker-compose down -v
```

### よくあるミス

| 症状 | 原因 | 解決策 |
|---|---|---|
| GAS で関数が見つからない | `global.foo = foo` の登録忘れ | `src/main.ts` で登録する |
| シークレットが取れない | Script Properties に未登録 | GAS エディタの「プロジェクトの設定」で登録 |
| OAuth エラー | スコープ不足 | `appsscript.json` の `oauthScopes` に追加 |
| テストで GAS API が `undefined` | モック未追加 | `__tests__/mocks/gas-mocks.ts` を拡張 |

---

## 詳細なセットアップ手順

### 1. テンプレートのコピー

```bash
cp -r gas-template my-gas-project
cd my-gas-project
```

### 2. 依存インストール

```bash
npm install
```

### 3. clasp 認証 + Apps Script API 有効化

```bash
npx clasp login
```

Apps Script API: https://script.google.com/home/usersettings

### 4. GAS プロジェクトの作成または接続

**新規作成**:

```bash
npx clasp create --title "My GAS Project" --type standalone --rootDir ./dist
```

利用可能な `--type`: `standalone` / `sheets` / `docs` / `slides` / `forms`

**既存プロジェクトに接続**:

```bash
npx clasp clone <SCRIPT_ID> --rootDir ./dist
```

スクリプト ID は GAS エディタの URL (`https://script.google.com/.../d/<SCRIPT_ID>/edit`) から取得。

### 5. Script Properties を登録

[PropertiesService セットアップ](#propertiesservice-セットアップ) を参照。

### 6. ビルドとデプロイ

```bash
npm run build
npm run push
npm run open
```

---

## CI（GitHub Actions）

`.github/workflows/ci.yml` は `main` / `develop` ブランチへの push および PR で次のジョブを実行します:

1. Node 20 セットアップ
2. `npm ci`
3. `npm run lint`
4. `npm test -- --coverage`
5. `npm run build`
6. カバレッジレポートを artifact としてアップロード

> ℹ️ **このテンプレートは GAS への自動デプロイは行いません**。`clasp` の認証情報を CI に持たせると漏洩リスクがあるため、デプロイは手元で `npm run deploy` を実行する運用を想定しています。自動デプロイを行う場合は、`CLASP_CREDENTIALS` シークレットを GitHub に登録し、デプロイジョブを `ci.yml` に追加してください。

---

## カスタマイズ

### OAuth スコープの追加

GAS の新しい API を使うときは `appsscript.json` の `oauthScopes` にスコープを追加してください。本テンプレートは以下を登録済み:

| スコープ | 必要なケース |
|---|---|
| `script.external_request` | `UrlFetchApp` で外部 HTTP リクエスト |
| `script.scriptapp` | `ScriptApp` のトリガー操作（`runWithContinuation` が使用） |
| `spreadsheets` | `SpreadsheetApp` 全般（ロガーのシート出力も含む） |
| `userinfo.email` | `Session.getActiveUser().getEmail()` |

```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
  ]
}
```

追加後は `npm run push` で GAS に反映され、初回実行時に認可ダイアログが表示されます。

### Advanced Services の有効化

```json
{
  "dependencies": {
    "enabledAdvancedServices": [
      { "userSymbol": "Drive", "serviceId": "drive", "version": "v3" }
    ]
  }
}
```

### 共通モジュールの追加

`src/lib/` の下に新しいモジュールを作成し、`src/main.ts` から相対 import します。`__tests__/unit/lib/` 配下に同名のテストファイルを置いて 70% 以上のカバレッジを維持してください。

---

## 参考リンク

### 公式ドキュメント

- [Google Apps Script](https://developers.google.com/apps-script)
- [clasp（GitHub）](https://github.com/google/clasp) / [clasp 公式ガイド](https://developers.google.com/apps-script/guides/clasp)
- [TypeScript](https://www.typescriptlang.org/)
- [Jest（日本語）](https://jestjs.io/ja/)

### 学習リソース

- [TypeScript ハンドブック（日本語）](https://www.typescriptlang.org/ja/docs/)
- [サバイバル TypeScript](https://typescriptbook.jp/)

### ツール

- [esbuild](https://esbuild.github.io/) / [esbuild-gas-plugin](https://github.com/mahaker/esbuild-gas-plugin)
- [Docker](https://www.docker.com/)

---

## 貢献

プルリクエストや Issue を歓迎します。改善提案・質問は Issue でお気軽に。

## ライセンス

MIT
