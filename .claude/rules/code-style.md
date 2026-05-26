---
paths:
  - "src/**/*.ts"
  - "__tests__/**/*.ts"
  - "esbuild.config.js"
---

# Code Style Rules

このプロジェクト（および派生 GAS プロジェクト）で守るべき書き方の規約。

## ES6 構文方針

### 変数宣言

- **`var` は禁止**
- 第一選択は `const`、再代入が必要なときのみ `let`

### 関数定義

- **内部ヘルパー関数（モジュール内 private 用途）はアロー関数で書く**

  ```typescript
  const getCachedSecret = (key: string): string | null => { ... };
  ```

- **GAS global 登録対象の関数は `function` 宣言を維持**（hoisting と global 登録の慣例）

  ```typescript
  function doGet(e: GoogleAppsScript.Events.DoGet) { ... }
  declare const global: { doGet: typeof doGet };
  global.doGet = doGet;
  ```

- **`export function` も維持を許容**（呼び出し側の型推論・JSDoc 表示・読みやすさのため）。ただし新規追加するモジュール内 helper はアロー優先

### 文字列リテラル

- 文字列連結 `+` ではなく **テンプレートリテラル** を使う

  ```typescript
  // NG: 'completed: ' + count + ' items'
  // OK: `completed: ${count} items`
  ```

### 配列・オブジェクト操作

- 配列結合は `.concat(...)` ではなく **spread** を使う

  ```typescript
  // NG: a.concat(b)
  // OK: [...a, ...b]
  ```

- オブジェクトのマージは `Object.assign({}, ...)` ではなく spread

  ```typescript
  // NG: Object.assign({}, base, override)
  // OK: { ...base, ...override }
  ```

### イテレーション

- `for` ループは原則として `forEach` / `map` / `flatMap` / `for ... of` に置き換える
- ただし **インデックス参照が必須**（前後要素アクセス、index と value 同時利用、複数配列の並行処理、break/continue 制御）の場合は `for (let i = 0; ...)` を維持してよい

### Null/Undefined ハンドリング

- 短絡評価より **Optional Chain (`?.`) と Nullish Coalescing (`??`)** を使う

  ```typescript
  // NG: obj && obj.key || defaultValue
  // OK: obj?.key ?? defaultValue
  ```

## class より関数優先

### 原則

**関数 + クロージャで書く**。class はデフォルトでは避ける。

### 例外

- **Error 継承は class 必須**

  `extends Error` の prototype chain と `instanceof` 判定が必要。`AppError` および各種派生エラーは class で書く

  ```typescript
  export class SheetNotFoundError extends AppError { ... }
  ```

### 禁止パターン

- 「静的メソッドだけのクラス」は禁止。モジュール export 関数 + module-level state で書く

  ```typescript
  // NG
  export class Secrets {
    static getRequired(key: string): string { ... }
    static clearCache(): void { ... }
  }

  // OK
  const cache = new Map<string, string | null>();
  export const getRequiredSecret = (key: string): string => { ... };
  export const clearSecretsCache = (): void => cache.clear();
  ```

- 「名前付きインスタンスを生成するだけのクラス」も関数化する

  ```typescript
  // NG
  export class Logger {
    constructor(private name: string) {}
    info(message: string) { ... }
  }

  // OK
  export interface Logger {
    info(message: string, context?: unknown): void;
  }
  export const createLogger = (name = 'app'): Logger => {
    const log = (message: string) => { /* uses name via closure */ };
    return { info: (m, c) => log(m, c) };
  };
  ```

## dist/Code.js banner 仕様

`esbuild.config.js` の `banner.js` は以下のフォーマットで統一する（リファレンス: zpc-datahub-gas）。

```javascript
const buildDateTime = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

const buildOptions = {
  // ...
  banner: {
    js: `/**
 * ⚠️ 警告: このファイルは自動生成されています
 *
 * 直接このファイルを編集しないでください。
 * 編集する場合は、以下のリポジトリを利用してください:
 * https://github.com/TOMAP-Inc/<repo-name>
 *
 * ビルド日時: ${buildDateTime} JST
 */`,
  },
};
```

- `<repo-name>` は各プロジェクトのリポジトリ名に置換
- ビルド日時は esbuild 起動時の JST を埋め込む（PR ごとに更新される）
- `dist/` は `.gitignore` 対象（PR noise を回避）

## 命名

- 関数名: `xxxYyy` の動詞先頭・lowerCamelCase
  - 旧 `Secrets.getRequired` → `getRequiredSecret`（動詞 + 対象）
  - 旧 `Secrets.clearCache` → `clearSecretsCache`
- module-level cache や internal state は **export しない**（cache.clearXxx 等のクリア関数だけ公開）
