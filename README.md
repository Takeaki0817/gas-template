# Google Apps Script プロジェクトテンプレート

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Jest](https://img.shields.io/badge/Jest-29.7+-green.svg)](https://jestjs.io/)
[![Docker](https://img.shields.io/badge/Docker-ready-blue.svg)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScript + clasp + Jest + Docker による、モダンな Google Apps Script 開発環境のテンプレートです。

---

## 📍 3 分でスタート

このテンプレートを使って、すぐに GAS 開発を始められます！

### 最速セットアップ（3 ステップ）

**1️⃣ コピー**

```bash
cp -r gas-template my-project && cd my-project
```

**2️⃣ インストール**

```bash
npm install
```

**3️⃣ 認証 & 作成**

```bash
npx clasp login
npx clasp create --title "My Project" --type standalone --rootDir ./dist
```

✅ これで開発準備完了！続きは [開発の始め方](#-開発の始め方) へ

---

## 🎓 このプロジェクトについて

### 何ができるの？

このテンプレートは、**Google Apps Script（GAS）を本格的に開発するための環境**です。

#### 通常の GAS 開発との違い

|                    | 通常の GAS 開発 | このテンプレート |
| ------------------ | --------------- | ---------------- |
| **エディタ**       | ブラウザのみ    | VSCode など自由  |
| **バージョン管理** | ❌ 難しい       | ✅ Git で管理    |
| **テスト**         | ❌ できない     | ✅ 自動テスト    |
| **チーム開発**     | ❌ しづらい     | ✅ 効率的に可能  |
| **型チェック**     | ❌ なし         | ✅ TypeScript    |

### 全体像（アーキテクチャ図）

```
+-----------------------------------------------------------------+
|                         あなたのPC                              |
|                                                                 |
|   +-------------+      +-------------+      +-------------+     |
|   |  エディタ   |      | ターミナル  |      |   Docker    |     |
|   | (VSCode等)  |      |             |      |  (optional) |     |
|   +------+------+      +------+------+      +------+------+     |
|          |                    |                    |            |
|          +--------------------+--------------------+            |
|                               |                                 |
|                               v                                 |
|          +-------------------------------------------+          |
|          |        このテンプレート                   |          |
|          |                                           |          |
|          |  +----------+  +------+  +--------+       |          |
|          |  |TypeScript|  | clasp|  |  Jest  |       |          |
|          |  +----------+  +------+  +--------+       |          |
|          |  +----------+  +----------------+         |          |
|          |  | esbuild  |  |   GAS Mocks    |         |          |
|          |  +----------+  +----------------+         |          |
|          +-------------------------------------------+          |
+---------------------------+-------------------------------------+
                            |
                            | clasp push
                            | (コードをアップロード)
                            v
         +---------------------------------------------+
         |    Google Apps Script (クラウド)            |
         |                                             |
         |   スプレッドシート / Gmail / Drive等        |
         +---------------------------------------------+
```

---

## 🛠️ 使用技術の説明

各技術が**なぜ必要か**を理解しましょう。

| 技術           | 役割               | 初心者向け説明                                      | 学習難易度 |
| -------------- | ------------------ | --------------------------------------------------- | ---------- |
| **TypeScript** | プログラミング言語 | JavaScript に「型」を追加。バグを減らし、補完が効く | ⭐⭐☆☆☆    |
| **clasp**      | GAS 連携ツール     | ローカルと GAS をつなぐ橋渡し役                     | ⭐☆☆☆☆     |
| **Jest**       | テストツール       | コードが正しく動くかを自動確認                      | ⭐⭐☆☆☆    |
| **esbuild**    | ビルドツール       | TypeScript を GAS 用の JavaScript に変換            | ⭐☆☆☆☆     |
| **Docker**     | 環境構築ツール     | チーム全員が同じ環境で開発できる                    | ⭐⭐⭐☆☆   |

### 各技術の詳細

<details>
<summary><strong>📘 TypeScript とは？</strong>（クリックで展開）</summary>

**一言で**: JavaScript に型チェック機能を追加した言語

**メリット**:

- ✅ エディタで自動補完が効く（書きやすい）
- ✅ 実行前にバグを発見できる（安全）
- ✅ コードの意図が明確になる（読みやすい）

**例**:

```typescript
// JavaScript（型なし）- バグに気づきにくい
function add(a, b) {
	return a + b;
}
add(1, '2'); // "12" になってしまう！

// TypeScript（型あり）- エディタが警告してくれる
function add(a: number, b: number): number {
	return a + b;
}
add(1, '2'); // ❌ エラー: 文字列は使えません
```

📚 **学習リソース**: [TypeScript 公式ハンドブック（日本語）](https://www.typescriptlang.org/ja/docs/)

</details>

<details>
<summary><strong>🔧 clasp とは？</strong>（クリックで展開）</summary>

**一言で**: GAS をローカルで開発するためのコマンドラインツール

**主なコマンド**:

```bash
clasp login   # Google認証
clasp create  # 新規プロジェクト作成
clasp push    # ローカル → GAS アップロード
clasp pull    # GAS → ローカル ダウンロード
clasp open    # ブラウザでGASエディタを開く
```

**なぜ必要？**

- ✅ ブラウザのエディタより VSCode の方が便利
- ✅ Git でバージョン管理できる
- ✅ チームで同時に開発できる

📚 **学習リソース**: [clasp 公式ドキュメント](https://developers.google.com/apps-script/guides/clasp)

</details>

<details>
<summary><strong>🧪 Jest とは？</strong>（クリックで展開）</summary>

**一言で**: コードが正しく動くかを自動でチェックするツール

**なぜ必要？**

- ✅ 修正後に全機能を手動確認するのは大変
- ✅ バグを早期発見できる
- ✅ リファクタリングが安全にできる

**簡単な例**:

```typescript
// テスト対象の関数
function add(a: number, b: number) {
	return a + b;
}

// テストコード
test('1 + 2 は 3 になる', () => {
	expect(add(1, 2)).toBe(3); // ✅ パス
});
```

**実行方法**:

```bash
npm test              # 全テスト実行
npm run test:watch    # ファイル変更時に自動実行
npm run test:coverage # カバレッジも表示
```

📚 **学習リソース**: [Jest 公式ドキュメント](https://jestjs.io/ja/)

</details>

<details>
<summary><strong>⚡ esbuild とは？</strong>（クリックで展開）</summary>

**一言で**: 超高速な JavaScript バンドラー

**このテンプレートでの役割**:

- TypeScript を JavaScript に変換
- 複数ファイルを 1 つにまとめる（bundle）
- GAS で動く形式に変換

**速度比較**:

- esbuild: 数十ミリ秒 ⚡
- 他のツール: 数秒 🐌

**普段意識する必要はありません**。`npm run build` で自動的に動きます。

</details>

<details>
<summary><strong>🐳 Docker とは？</strong>（クリックで展開）</summary>

**一言で**: どの PC でも同じ環境を再現できる仮想環境ツール

**メリット**:

- ✅ 「私の環境では動くのに...」がなくなる
- ✅ Node.js のバージョン違いでトラブルが起きない
- ✅ 新メンバーのセットアップが簡単

**Docker は必須ではありません**: ローカルで Node.js を使っても問題なし

**チーム開発では推奨**:

```bash
npm run docker:test   # Docker環境でテスト
npm run docker:dev    # Docker環境で開発
```

</details>

---

## 📁 ディレクトリ構造

### 基本構造（最初に知るべきファイル）

```
gas-template/
│
├─ 📂 src/              ← ⭐ あなたがコードを書く場所
│   ├─ main.ts          ← メインのGASコード
│   ├─ lib/             ← 共通関数置き場
│   │   └─ utils.ts
│   ├─ config/          ← 設定ファイル
│   │   └─ settings.ts
│   └─ types/           ← TypeScript型定義
│       └─ global.d.ts
│
├─ 📂 __tests__/        ← ⭐ テストコードを書く場所
│   ├─ unit/            ← ユニットテスト
│   │   ├─ lib/
│   │   └─ config/
│   ├─ mocks/           ← GAS APIのモック
│   │   └─ gas-mocks.ts
│   └─ setup.ts         ← テスト初期化
│
├─ 📂 dist/             ← ビルド後のファイル（自動生成）
│   └─ Code.js          ← GASにアップロードされるファイル
│
├─ 📄 package.json      ← プロジェクト設定（依存関係など）
├─ 📄 .clasp.json       ← GAS接続設定
├─ 📄 tsconfig.json     ← TypeScript設定
├─ 📄 jest.config.js    ← Jest設定
└─ 📄 README.md         ← このファイル
```

### 詳細構造（全ファイル）

<details>
<summary>すべてのファイル・ディレクトリを見る</summary>

| パス                 | 役割             | 編集する？      | 説明                   |
| -------------------- | ---------------- | --------------- | ---------------------- |
| `src/`               | ソースコード     | ✅ よく編集     | あなたの GAS コード    |
| `__tests__/`         | テストコード     | ✅ よく編集     | テストを書く場所       |
| `dist/`              | ビルド成果物     | ❌ 自動生成     | ビルド結果（触らない） |
| `node_modules/`      | 依存ライブラリ   | ❌ 自動生成     | npm でインストール     |
| `coverage/`          | カバレッジ       | ❌ 自動生成     | テスト結果             |
| `package.json`       | プロジェクト設定 | △ たまに編集    | 依存関係の追加時       |
| `.clasp.json`        | clasp 設定       | △ 初回のみ      | スクリプト ID 設定     |
| `tsconfig.json`      | TypeScript 設定  | △ たまに編集    | 型チェック設定         |
| `jest.config.js`     | Jest 設定        | △ たまに編集    | テスト設定             |
| `esbuild.config.js`  | ビルド設定       | ❌ 基本触らない | ビルド処理             |
| `docker-compose.yml` | Docker 設定      | ❌ 基本触らない | Docker 環境            |
| `.github/workflows/` | CI/CD 設定       | △ CI/CD 使う時  | 自動デプロイ           |

</details>

---

## 🔄 開発フロー

### 全体の流れ

```
+----------------------------------------------------+
|                                                    |
|  [1] コード編集                                    |
|      src/*.ts ファイルを編集                       |
|                                                    |
+----------------------------------------------------+
                        |
                        v
+----------------------------------------------------+
|                                                    |
|  [2] テスト実行 (任意)                             |
|      npm test                                      |
|                                                    |
+----------------------------------------------------+
                        |
                        v
+----------------------------------------------------+
|                                                    |
|  [3] ビルド                                        |
|      npm run build                                 |
|      -> TypeScript を JavaScript に変換            |
|                                                    |
+----------------------------------------------------+
                        |
                        v
+----------------------------------------------------+
|                                                    |
|  [4] GASにプッシュ                                 |
|      npm run push                                  |
|      -> dist/Code.js を GAS へアップロード         |
|                                                    |
+----------------------------------------------------+
                        |
                        v
+----------------------------------------------------+
|                                                    |
|  [5] ブラウザで確認                                |
|      npm run open                                  |
|      -> GASエディタで動作確認                      |
|                                                    |
+----------------------------------------------------+
```

### 🚀 開発の始め方

#### 初めての開発手順

**ステップ 1: コードを書く**

```bash
# VSCodeなどでファイルを開く
code src/main.ts
```

**ステップ 2: テストする（ローカル・任意）**

```bash
npm test
```

**ステップ 3: ビルドして GAS にアップロード**

```bash
npm run push
# または
npm run build  # ビルドのみ
npx clasp push # プッシュのみ
```

**ステップ 4: GAS エディタで確認**

```bash
npm run open
```

### よくある開発パターン

#### パターン 1: 自動ビルド + 自動テスト（推奨）

```bash
# ターミナル1
npm run watch        # ファイル変更を監視して自動ビルド

# ターミナル2
npm run test:watch   # ファイル変更でテスト自動実行
```

#### パターン 2: テストなしで開発

```bash
# ファイル編集後
npm run push         # ビルド → プッシュ
npm run open         # GASエディタで確認
```

#### パターン 3: Docker 環境で開発

```bash
npm run docker:dev   # Docker環境起動
```

---

## 📝 コマンド一覧

### ビルド・デプロイ

| コマンド         | 説明                             | 使用頻度   |
| ---------------- | -------------------------------- | ---------- |
| `npm run build`  | TypeScript をビルド              | ⭐⭐⭐     |
| `npm run push`   | ビルド後、GAS にプッシュ         | ⭐⭐⭐⭐⭐ |
| `npm run deploy` | ビルド、プッシュ、デプロイを実行 | ⭐⭐       |
| `npm run watch`  | ファイル変更を監視して自動ビルド | ⭐⭐⭐⭐   |
| `npm run open`   | GAS エディタをブラウザで開く     | ⭐⭐⭐     |

### テスト

| コマンド                | 説明                         | 使用頻度   |
| ----------------------- | ---------------------------- | ---------- |
| `npm test`              | ユニットテストを実行         | ⭐⭐⭐⭐⭐ |
| `npm run test:watch`    | テストを監視モードで実行     | ⭐⭐⭐⭐   |
| `npm run test:coverage` | カバレッジ付きでテストを実行 | ⭐⭐⭐     |

### Docker

| コマンド               | 説明                            | 使用頻度 |
| ---------------------- | ------------------------------- | -------- |
| `npm run docker:build` | Docker 環境をビルド             | ⭐       |
| `npm run docker:test`  | Docker 環境でテストを実行       | ⭐⭐     |
| `npm run docker:dev`   | Docker 環境で開発モードを起動   | ⭐⭐     |
| `npm run docker:shell` | Docker コンテナ内でシェルを起動 | ⭐       |

---

## 🎯 学習パス

あなたのレベルに合わせた学習方法を提案します。

### 📗 初心者（JavaScript は書ける）

**1 週間で習得できること**:

- ✅ TypeScript の基本文法
- ✅ clasp の基本操作
- ✅ Jest での簡単なテスト

**推奨学習順序**:

1. [3 分でスタート](#-3分でスタート)を実行
2. `src/main.ts` のコードを読んで理解
3. 簡単な関数を追加してみる
4. `npm test` でテストを実行
5. `npm run push` で GAS にアップロード

**サンプル課題**:
「現在時刻を返す関数を作ってテストする」

### 📘 中級者（TypeScript 経験あり）

**すぐに活用できる機能**:

- ✅ Jest + モックでの本格テスト
- ✅ Docker 環境での開発
- ✅ GitHub Actions での自動デプロイ

**推奨学習順序**:

1. テストコードを読む（`__tests__/unit/`）
2. モックの仕組みを理解（`__tests__/mocks/`）
3. Docker 環境を試す（`npm run docker:test`）
4. CI/CD を設定（GitHub Actions）

### 📕 上級者（フルスタック経験あり）

**カスタマイズポイント**:

- ✅ esbuild 設定の最適化
- ✅ Jest カバレッジ閾値の調整
- ✅ モックライブラリの拡張
- ✅ Docker マルチステージビルド

**チーム開発での活用**:

- Prettier や ESLint の追加
- pre-commit フックの設定
- モノレポ構成の導入

---

## 🎓 チュートリアル

### Tutorial 1: 初めての関数作成（10 分）

**目標**: 挨拶メッセージを返す関数を作る

**ステップ 1: 関数を書く**

`src/greeting.ts` を新規作成:

```typescript
/**
 * 名前から挨拶メッセージを生成
 */
export function greet(name: string): string {
	return `こんにちは、${name}さん！`;
}
```

**ステップ 2: テストを書く**

`__tests__/unit/greeting.test.ts` を作成:

```typescript
import { greet } from '../../src/greeting';

describe('greet', () => {
	it('名前を含む挨拶を返す', () => {
		expect(greet('太郎')).toBe('こんにちは、太郎さん！');
	});

	it('空文字列でも動作する', () => {
		expect(greet('')).toBe('こんにちは、さん！');
	});
});
```

**ステップ 3: テスト実行**

```bash
npm test
```

✅ **完了**: テストがパスすれば成功！

### Tutorial 2: GAS からテスト関数を呼ぶ（15 分）

**目標**: 作った関数を GAS で使えるようにする

**ステップ 1: main.ts に追加**

`src/main.ts` を編集:

```typescript
import { greet } from './greeting';

function testGreeting() {
	const message = greet('Taro');
	Logger.log(message);
	return message;
}

// グローバルに公開
global.testGreeting = testGreeting;
```

**ステップ 2: ビルド & プッシュ**

```bash
npm run push
```

**ステップ 3: GAS で実行**

```bash
npm run open
```

GAS エディタで `testGreeting` 関数を実行してログを確認！

---

## ❓ よくある質問（FAQ）

<details>
<summary><strong>Q1. Node.jsがインストールされていないのですが？</strong></summary>

**A**: 以下のいずれかの方法で解決できます。

**方法 1: Node.js をインストール（推奨）**

- [Node.js 公式サイト](https://nodejs.org/)から「LTS 版」をダウンロード
- インストール後、`node -v` で確認

**方法 2: Docker を使う**

- Docker 環境なら Node.js のインストール不要
- `npm run docker:test` で開発可能

</details>

<details>
<summary><strong>Q2. TypeScriptがわからなくても使えますか？</strong></summary>

**A**: はい、使えます！

- サンプルコードをコピーして使う → ✅ OK
- 既存コードを少し修正 → ✅ OK
- 新しい機能を書く → 📖 TypeScript 基礎を学習推奨

**学習リソース**:

- [TypeScript 公式ハンドブック（日本語）](https://www.typescriptlang.org/ja/docs/)
- [サバイバル TypeScript](https://typescriptbook.jp/)

</details>

<details>
<summary><strong>Q3. テストは必須ですか？</strong></summary>

**A**: いいえ、オプションです。

**テストなしでも使える**:

```bash
npm run build  # ビルドのみ
npm run push   # GASにアップロード
```

**ただしテストを書くメリット**:

- ✅ バグの早期発見
- ✅ リファクタリングが安全
- ✅ チーム開発での品質保証

</details>

<details>
<summary><strong>Q4. Dockerは必須ですか？</strong></summary>

**A**: いいえ、オプションです。

| 項目             | ローカル開発             | Docker 開発      |
| ---------------- | ------------------------ | ---------------- |
| **セットアップ** | Node.js インストール必要 | Docker のみで OK |
| **速度**         | 速い ⚡                  | 少し遅い 🐌      |
| **環境統一**     | 各自の環境に依存         | 全員同じ環境     |
| **推奨用途**     | 個人開発                 | チーム開発       |

</details>

<details>
<summary><strong>Q5. 既存のGASプロジェクトを移行できますか？</strong></summary>

**A**: はい、できます！

**移行手順**:

1. 既存プロジェクトを clone
   ```bash
   npx clasp clone <SCRIPT_ID> --rootDir ./dist
   ```
2. `dist/Code.js` を `src/main.ts` にコピー
3. TypeScript 形式に変換（型を追加）
4. テストを書く（任意）
5. ビルド確認
   ```bash
   npm run build
   ```

</details>

---

## 🐛 トラブルシューティング

### 😵 エラーメッセージ別の解決方法

#### `command not found: npm`

**原因**: Node.js がインストールされていない

**解決策**:

1. [Node.js 公式サイト](https://nodejs.org/)から LTS 版をインストール
2. ターミナルを再起動
3. `node -v` と `npm -v` で確認

---

#### `clasp: command not found`

**原因**: clasp がグローバルインストールされていない

**解決策**:

```bash
npm install -g @google/clasp

# 確認
clasp -v
```

---

#### `Permission denied`（Mac/Linux）

**原因**: 管理者権限が必要

**解決策**:

```bash
sudo npm install -g @google/clasp
```

---

#### `User has not enabled the Apps Script API`

**原因**: Apps Script API が有効になっていない

**解決策**:

1. https://script.google.com/home/usersettings を開く
2. 「Google Apps Script API」をオンにする
3. `npx clasp login` で再認証

---

#### テストが失敗する

**原因**: 依存関係が古いまたはキャッシュの問題

**解決策**:

```bash
# Jestキャッシュをクリア
npx jest --clearCache

# node_modulesを再インストール
rm -rf node_modules package-lock.json
npm install

# TypeScript設定を確認
npx tsc --noEmit
```

---

#### ビルドエラー

**原因**: TypeScript の型エラー

**解決策**:

```bash
# 詳細なエラーを確認
npx tsc --noEmit

# エラー箇所を修正後
npm run build
```

---

#### Docker 環境で問題が発生

**原因**: Docker イメージやボリュームの問題

**解決策**:

```bash
# Dockerイメージを再ビルド
docker-compose build --no-cache

# Dockerボリュームをクリア
docker-compose down -v

# 再起動
npm run docker:dev
```

---

### 💡 よくあるミス

| 症状                    | 原因                | 解決策                                |
| ----------------------- | ------------------- | ------------------------------------- |
| テストが失敗する        | node_modules が古い | `npm install` を再実行                |
| ビルドできない          | TypeScript エラー   | `npx tsc --noEmit` でエラー確認       |
| push できない           | 認証切れ            | `npx clasp login` で再認証            |
| 関数が見つからない      | グローバル登録忘れ  | `global.関数名 = 関数名` を追加       |
| テストで GAS API エラー | モックが不足        | `__tests__/mocks/gas-mocks.ts` に追加 |

---

## 📚 詳細なセットアップ手順

### セットアップ手順（詳細版）

#### 1. テンプレートのコピー

```bash
# テンプレートを新しいプロジェクトとしてコピー
cp -r gas-template my-gas-project
cd my-gas-project
```

#### 2. 依存関係のインストール

```bash
npm install
```

#### 3. clasp の認証

```bash
# Googleアカウントで認証
npx clasp login
```

ブラウザが開くので、Google アカウントでログインして認証します。

> **注意**: 初回は Apps Script API を有効化する必要があります
> https://script.google.com/home/usersettings

#### 4. GAS プロジェクトの作成または接続

##### 新規プロジェクトを作成する場合

```bash
# スタンドアロンスクリプトとして作成
npx clasp create --title "My GAS Project" --type standalone --rootDir ./dist

# または、スプレッドシート連携スクリプトとして作成
npx clasp create --title "My GAS Project" --type sheets --rootDir ./dist
```

作成された scriptId が `.clasp.json` に自動的に記録されます。

**プロジェクトタイプ**:

- `standalone`: 独立したスクリプト
- `sheets`: スプレッドシート用
- `docs`: ドキュメント用
- `slides`: スライド用
- `forms`: フォーム用

##### 既存プロジェクトに接続する場合

```bash
# スクリプトIDを指定してクローン
npx clasp clone <SCRIPT_ID> --rootDir ./dist
```

スクリプト ID は、GAS エディタの URL (`https://script.google.com/...d/<SCRIPT_ID>/edit`) から取得できます。

#### 5. ビルドとデプロイ

```bash
# TypeScriptをビルド
npm run build

# GASにプッシュ
npm run push

# または、ビルドとプッシュを一度に実行
npm run deploy
```

#### 6. GAS エディタで確認

```bash
# ブラウザでGASエディタを開く
npm run open
```

---

## 🚀 GitHub Actions による自動デプロイ

### 1. clasp 認証情報の取得

```bash
# ホームディレクトリの認証情報を確認
cat ~/.clasprc.json
```

### 2. GitHub シークレットに設定

1. GitHub リポジトリの **Settings** → **Secrets and variables** → **Actions** に移動
2. **New repository secret** をクリック
3. Name: `CLASP_CREDENTIALS`
4. Value: `~/.clasprc.json` の内容をペースト

### 3. 自動デプロイの実行

`main` ブランチにプッシュすると、自動的に GAS にデプロイされます：

```bash
git add .
git commit -m "feat: 新機能を追加"
git push origin main
```

---

## 🔧 カスタマイズ

### スプレッドシート以外での使用

`src/main.ts` の `onOpen` 関数は、Google Spreadsheets でのみ動作します。他のサービス（Gmail、Calendar 等）を使用する場合は、該当箇所を適宜修正してください。

### Advanced Services の有効化

GAS API を使用する場合は、`appsscript.json` に追加します：

```json
{
	"dependencies": {
		"enabledAdvancedServices": [
			{
				"userSymbol": "Drive",
				"serviceId": "drive",
				"version": "v3"
			}
		]
	}
}
```

### OAuth スコープの追加

必要な権限を `appsscript.json` に追加します：

```json
{
	"oauthScopes": [
		"https://www.googleapis.com/auth/spreadsheets",
		"https://www.googleapis.com/auth/drive"
	]
}
```

---

## 📚 参考リンク

### 公式ドキュメント

- [Google Apps Script 公式ドキュメント](https://developers.google.com/apps-script)
- [clasp GitHub リポジトリ](https://github.com/google/clasp)
- [clasp 公式ドキュメント](https://developers.google.com/apps-script/guides/clasp)
- [TypeScript 公式サイト](https://www.typescriptlang.org/)
- [Jest 公式ドキュメント](https://jestjs.io/ja/)

### 学習リソース

- [TypeScript 公式ハンドブック（日本語）](https://www.typescriptlang.org/ja/docs/)
- [サバイバル TypeScript](https://typescriptbook.jp/)
- [Jest 入門](https://jestjs.io/ja/docs/getting-started)

### ツール・ライブラリ

- [esbuild-gas-plugin](https://github.com/mahaker/esbuild-gas-plugin)
- [esbuild](https://esbuild.github.io/)
- [Docker](https://www.docker.com/)

---

## 🤝 貢献

プルリクエストや Issue の作成を歓迎します！

改善提案や質問があれば、お気軽に Issue を立ててください。

---

## 📄 ライセンス

MIT

---

## 🎉 完成おめでとうございます！

このテンプレートを使って、快適な GAS 開発をお楽しみください！

質問があれば、[よくある質問](#-よくある質問faq)または[トラブルシューティング](#-トラブルシューティング)をご確認ください。

Happy Coding! 🚀
