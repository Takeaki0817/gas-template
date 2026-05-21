---
globs: ["src/**/*.ts"]
---

# GAS Source Code Rules

## TypeScript Configuration

- Strict mode enabled (strict, noImplicitAny, strictNullChecks, strictFunctionTypes)
- Target: ES2019 (GAS V8 runtime compatibility)
- Module: ESNext (bundled by esbuild)

## File Organization

| Path | Purpose |
|------|---------|
| `src/main.ts` | Entry point - define and register all GAS global functions |
| `src/config/settings.ts` | App configuration and PropertiesService helpers |
| `src/lib/errors.ts` | AppError hierarchy (MissingSecretError, DbConnectionError, SheetNotFoundError, RetriableError) |
| `src/lib/logger.ts` | Structured logger with level filtering and optional sheet output |
| `src/lib/secrets.ts` | Cached PropertiesService access via Secrets class |
| `src/lib/db.ts` | JDBC helpers: withConnection, executeQuery, listTables, getColumns |
| `src/lib/long-running.ts` | runWithContinuation for 6-min GAS limit workaround |
| `src/lib/utils.ts` | Shared utilities (log, formatDate, sleep, chunk, deepCopy, generateRandomString) |
| `src/types/global.d.ts` | Type definitions (AppConfig, LogLevel, global object) |
| `src/handlers/http.ts` | doGet / doPost GAS entry points |
| `src/handlers/scheduled.ts` | Time-driven trigger entry points |

Add new modules under `src/lib/` or create feature directories under `src/`.

## Secrets (PropertiesService)

Use `Secrets` from `src/lib/secrets.ts` — values are cached per execution:

```typescript
import { Secrets } from './lib/secrets';
const apiKey = Secrets.getRequired('API_KEY');
const timeout = Secrets.getRequired('TIMEOUT', Number);
const env = Secrets.getOptional('APP_ENV', 'development');
Secrets.validateAll(['API_KEY', 'DB_USER']); // throws MissingSecretError on first miss
```

## Error Handling (AppError)

Use `AppError` subclasses from `src/lib/errors.ts`. Call `serialize()` for structured logging:

```typescript
import { AppError, DbConnectionError } from './lib/errors';
try { ... } catch (e) {
  if (e instanceof AppError) logger.error('fail', e.serialize());
}
```

## Database (JDBC)

Use helpers from `src/lib/db.ts`. `withConnection` always closes the connection:

```typescript
import { withConnection, executeQuery } from './lib/db';
const rows = withConnection(config, (conn) =>
  executeQuery(conn, 'SELECT * FROM t WHERE id = ?', [id])
);
```

## Long-Running Tasks

Use `runWithContinuation` from `src/lib/long-running.ts` to resume across the 6-min limit. State (remaining items + next index) is persisted to PropertiesService; a time-driven trigger resumes the same function in a later execution.

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

引数:
- `jobName: string` — PropertiesService の state key と、デフォルトのトリガー関数名に使われる
- `items: T[]` — 処理対象の配列
- `processItem: (item: T) => void` — 各要素を処理する関数
- `options.maxExecMs?: number` — 1 回の実行で使う上限ミリ秒（デフォルト 5 分）
- `options.triggerFunctionName?: string` — 継続トリガーが呼び出す関数名（デフォルトは `jobName`）

Required OAuth scope: `https://www.googleapis.com/auth/script.scriptapp` (for `ScriptApp.newTrigger` / `getProjectTriggers` / `deleteTrigger`).

## Logger

Use `getLogger` from `src/lib/logger.ts`. Level controlled by `LOG_LEVEL` Script Property:

```typescript
import { getLogger } from './lib/logger';
const logger = getLogger('moduleName');
logger.info('message', { key: 'value' });
```

## GAS Global Function Registration

Every function callable from GAS must follow this pattern in `src/main.ts`:

1. Define the function at module scope
2. Declare the global type
3. Register on global object

```typescript
function myFunction(): void { /* implementation */ }

declare const global: { myFunction: typeof myFunction; };
global.myFunction = myFunction;
```

The `esbuild-gas-plugin` handles the final GAS-compatible output.

## Configuration Management

Use PropertiesService for runtime config, NOT process.env or .env files:
```typescript
PropertiesService.getScriptProperties().getProperty('API_KEY');
```

Static config belongs in `src/config/settings.ts` as exported constants.

## Available GAS APIs

Type definitions from `@types/google-apps-script` provide:
- SpreadsheetApp, Sheet, Range
- Logger, Utilities
- PropertiesService
- UrlFetchApp
- HtmlService, ContentService
- Session, ScriptApp
- DriveApp, GmailApp, CalendarApp

Add required OAuth scopes to `appsscript.json` when using new APIs.

## Import Pattern

Use relative imports between modules:
```typescript
import { config } from './config/settings';
import { log } from './lib/utils';
import type { AppConfig } from '../types/global';
```

Prefer `import type` for type-only imports.

## Comments and Documentation

Write comments and JSDoc in Japanese:
```typescript
/**
 * 日付を YYYY-MM-DD 形式にフォーマット
 */
export function formatDate(date: Date): string { ... }
```

## Error Handling

Wrap GAS API calls in try/catch. GAS environment may differ (Spreadsheet vs standalone):
```typescript
try {
  const ui = SpreadsheetApp.getUi();
  ui.alert(message);
} catch (error) {
  Logger.log(message);
}
```
