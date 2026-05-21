---
name: gas-best-practices
description: Google Apps Script の品質ゲート。GAS API（SpreadsheetApp, Jdbc, PropertiesService, ScriptApp, UrlFetchApp, CacheService, LockService 等）を扱う TypeScript ファイルを書く・読む・レビューする時に必ず参照する。バッチ操作、6分実行制限、トリガー継続、Cache/Lock、JDBC バッチ、V8 ランタイムの罠、シークレット・PII の取り扱いを網羅。Use when reading or writing TypeScript files under src/ that use Google Apps Script services, or when reviewing GAS-related code.
---

# GAS Best Practices

Google Apps Script 開発の品質ゲート。実装・レビューの前後で参照し、本テンプレートに既に組み込まれているヘルパー（`src/lib/`）を活用する。

## 出典

- [Best practices](https://developers.google.com/apps-script/guides/support/best-practices)
- [V8 ランタイム](https://developers.google.com/apps-script/guides/v8-runtime)
- [Triggers](https://developers.google.com/apps-script/guides/triggers)
- [JDBC](https://developers.google.com/apps-script/guides/jdbc)
- [Logging](https://developers.google.com/apps-script/guides/logging)
- [Storing data](https://developers.google.com/apps-script/storing_data_spreadsheets)

---

## 1. バッチ操作（パフォーマンスの最大要因）

GAS は **Spreadsheet サービスへの 1 回の呼び出しに数百 ms かかる**。ループ内で `setValue` / `getValue` を呼ぶのが最大のアンチパターン。

### ❌ NG: セル単位で読み書き

```typescript
for (let row = 1; row <= 100; row++) {
  const value = sheet.getRange(row, 1).getValue();  // 100 回呼ぶ
  sheet.getRange(row, 2).setValue(value * 2);       // さらに 100 回
}
```

### ✅ OK: 一括取得 → JS 処理 → 一括書き戻し

```typescript
const values = sheet.getRange(1, 1, 100, 1).getValues();  // 1 回
const doubled = values.map(([v]) => [v * 2]);
sheet.getRange(1, 2, 100, 1).setValues(doubled);          // 1 回
```

100 要素で **約 200 倍速くなる**。配列形状は `T[][]`（行 × 列）。

---

## 2. Cache サービス（重複処理回避）

```typescript
const cache = CacheService.getScriptCache();
const cached = cache.get('users:list');
if (cached) return JSON.parse(cached);
const fresh = fetchUsers();
cache.put('users:list', JSON.stringify(fresh), 600); // 600 秒
```

- キー **250 文字以下**、値 **100KB 以下**、デフォルト expire **10 分**
- `getUserCache()` / `getDocumentCache()` も同様の制約

---

## 3. Lock サービス（排他制御）

同じトリガーが並行起動する可能性がある処理（Webhook、cron）では必須。

```typescript
const lock = LockService.getScriptLock();
if (!lock.tryLock(10000)) {
  throw new Error('別実行が走っています');
}
try {
  // 共有リソースへの書き込み
} finally {
  lock.releaseLock();
}
```

- `tryLock(ms)` の戻り値（boolean）を必ずチェック
- `waitLock` は失敗時に例外を投げるので `tryLock` の方が制御しやすい

---

## 4. 6 分実行制限

1 回の実行は **6 分（無料・有料問わず）** で必ず打ち切られる。Google Workspace アカウントは 30 分まで。

### ✅ 本テンプレート組み込み: `runWithContinuation`

```typescript
import { runWithContinuation } from './lib/long-running';

function syncAllUsers(): void {
  runWithContinuation('syncAllUsers', userIds, (id) => processUser(id), {
    maxExecMs: 5 * 60 * 1000,  // 余裕を残してチェックポイント
  });
}
declare const global: { syncAllUsers: typeof syncAllUsers };
global.syncAllUsers = syncAllUsers;
```

残作業と `nextIndex` は PropertiesService に保存され、ワンショットトリガーで自動再開する。詳細は `src/lib/long-running.ts`。

> ⚠️ **アンチパターン**: 自前で `Utilities.sleep` + 大量ループを書く。6 分超えで途中切れ + state 喪失するだけ。

---

## 5. JDBC（Cloud SQL）

### ✅ 本テンプレート組み込み: `withConnection` + `executeQuery`

```typescript
import { withConnection, executeQuery } from './lib/db';
const rows = withConnection(config, (conn) =>
  executeQuery(conn, 'SELECT * FROM users WHERE id = ?', [userId])
);
```

`finally` で接続を確実にクローズ（close 失敗で本来のエラーがマスクされない実装）。

### 大量書き込みは batch + manual commit

```typescript
withConnection(config, (conn) => {
  conn.setAutoCommit(false);
  const stmt = conn.prepareStatement('INSERT INTO entries (name, content) VALUES (?, ?)');
  for (const row of rows) {
    stmt.setString(1, row.name);
    stmt.setString(2, row.content);
    stmt.addBatch();
  }
  const result = stmt.executeBatch();
  conn.commit();
  return result;
});
```

行ごとに `executeUpdate` するのと比べて **10〜100 倍速い**。

### SQL Injection 対策

- 必ず `prepareStatement` + `setObject` / `setString`
- 文字列連結で SQL を組まない

---

## 6. V8 ランタイム特有の罠

### `instanceof` がライブラリ越しで効かない

```typescript
// ❌ ライブラリ B の関数で Project A から渡された Date を判定
function callee(date: unknown) {
  return date instanceof Date;  // 別実行コンテキストでは false
}

// ✅ 構造で判定
function callee(date: unknown) {
  return date != null && (date as Date).constructor?.name === 'Date';
}
```

`Date` / `Error` / 配列など、ネイティブ型を別 GAS プロジェクトから受け取る場合は要注意。

### ES2019 target

- async/await、`for...of`、テンプレートリテラルは OK
- Optional chaining `?.`、Nullish coalescing `??` も使用可（esbuild が変換）
- `appsscript.json` に `"runtimeVersion": "V8"` 必須

---

## 7. ログ

### console vs Logger

V8 ランタイムでは **`console.log` 系を優先**。Cloud Logging に構造化データとして出る。

```typescript
console.info('user logged in', { userId });
console.time('sync');
syncData();
console.timeEnd('sync');
```

### ✅ 本テンプレート組み込み: `getLogger`

```typescript
import { getLogger } from './lib/logger';
const logger = getLogger('myModule');
logger.info('login', { userId, password: 'p@ss' });
// → password は自動的に '***' に置換される
```

- `password` / `token` / `api_key` / `authorization` / `secret` / `credential` 等は自動レダクション
- `LOG_LEVEL` / `LOG_SHEET_NAME` は Script Properties で制御

### ❌ NG: PII・シークレットをそのままログに出す

公式ガイドにも明記。Cloud Logging は保持期間が長く、漏洩リスクが大きい。

---

## 8. トリガー

### Simple（予約名）

- `onOpen` / `onEdit` / `onSelectionChange` / `onInstall` / `doGet` / `doPost`
- **権限制限あり** — UrlFetchApp や認証必須サービスは使えない
- `doGet/doPost` はこの制限を受けない

### Installable（コードから登録）

```typescript
ScriptApp.newTrigger('myJob').timeBased().everyHours(1).create();
```

- 1 プロジェクトあたり **トリガー上限 20 個**
- 同名トリガーは追加してもクリーンアップされない → 登録前に `getProjectTriggers` でチェック

### ✅ 本テンプレート組み込み

`runWithContinuation` 完了時は `deleteContinuationTriggers` でクリーンアップされる。手動でトリガーを作るときは必ず削除コードもセット。

---

## 9. OAuth スコープ

- `appsscript.json` の `oauthScopes` に**明示的に**登録（自動推測に頼らない、レビュー困難になる）
- 最小権限の原則: `spreadsheets` ではなく `spreadsheets.currentonly` で済むなら後者

本テンプレートの登録済みスコープ:

| スコープ | 用途 |
|---|---|
| `script.external_request` | UrlFetchApp |
| `script.scriptapp` | ScriptApp トリガー操作（`runWithContinuation` が使う） |
| `spreadsheets` | SpreadsheetApp 全般 |
| `userinfo.email` | Session.getActiveUser().getEmail() |

新しい GAS サービスを使う時は必ず追加する。

---

## 10. テスト戦略

- GAS API はモック化（`__tests__/mocks/gas-mocks.ts`）
- 各テストで `jest.clearAllMocks()` + `Secrets.clearCache()`
- ロジックは `src/lib/` に切り出して GAS 依存を薄く保つ
- `src/main.ts` と `src/handlers/**` はカバレッジ除外（モックでは挙動再現しにくいため）

---

## アンチパターン早見表

| パターン | NG例 | OK例（本テンプレ） |
|---|---|---|
| セル単位アクセス | `for ... setValue` | `setValues` 一括 |
| 環境変数 | `process.env.KEY` | `Secrets.getRequired('KEY')` |
| シークレット直書き | `const KEY = 'sk-xxx'` | Script Properties 経由 |
| 接続未クローズ | `Jdbc.getCloudSqlConnection` 直叩き | `withConnection` |
| 6 分超え処理 | 普通の関数 | `runWithContinuation` |
| 並行起動衝突 | 自由実行 | `LockService.tryLock` |
| PII / シークレットログ | `logger.info('user', user)` | `getLogger`（自動レダクション） |
| `instanceof` 信頼 | ライブラリ越しで判定 | `constructor.name` / duck typing |
| トリガー無制限作成 | 都度 `newTrigger` | 既存トリガーを `getProjectTriggers` で確認 |
| 自動 OAuth 推測 | 書いて push | `appsscript.json` に明示登録 |

---

## レビュー時のチェックリスト

GAS コード変更を見る時、最低限以下を確認:

- [ ] ループ内で Spreadsheet サービスを呼んでいないか
- [ ] JDBC 接続が `withConnection` または相当の `finally close` で守られているか
- [ ] 6 分超えそうな処理に `runWithContinuation` か明示的な chunk が入っているか
- [ ] シークレット・PII がログに直接出ていないか（`getLogger` のレダクションを通っているか）
- [ ] 新しい GAS API 使用に対応する `oauthScopes` が `appsscript.json` に追加されているか
- [ ] トリガー作成箇所に削除/重複チェックがあるか
- [ ] `instanceof` をライブラリ越しに使っていないか
- [ ] 並行起動の可能性がある処理に `LockService` が入っているか

---

## 関連スキル

- `typescript-best-practices` — TS 型システム全般
- `codex-workflow` — Codex セカンドオピニオン（実装後のレビュー）

## 関連ルール

- @.claude/rules/gas-source.md — このプロジェクトの src 配置・コーディング規約
- @.claude/rules/testing.md — テストモック方針
