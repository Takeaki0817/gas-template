---
globs: ["__tests__/**", "**/*.test.*", "**/*.spec.*"]
---

# Testing Rules

## Structure

Test files mirror the src/ directory structure under `__tests__/unit/`:
- `src/lib/utils.ts` -> `__tests__/unit/lib/utils.test.ts`
- `src/config/settings.ts` -> `__tests__/unit/config/settings.test.ts`

## Framework

- Jest with ts-jest preset
- Test environment: Node.js
- Timezone: Asia/Tokyo (set in `__tests__/setup.ts`)
- Timeout: 10000ms

## GAS API Mocks

All GAS APIs are mocked globally via `__tests__/mocks/gas-mocks.ts`, loaded by `__tests__/setup.ts`.

Available mocks:
- `Logger` - log, clear
- `Utilities` - sleep, formatDate, base64Encode/Decode, getUuid
- `PropertiesService` - getScriptProperties, getUserProperties, getDocumentProperties (Map-backed store)
- `SpreadsheetApp` - getActiveSpreadsheet, openById, openByUrl, create, getUi (chainable menu builder)
- `UrlFetchApp` - fetch (returns mock response with getContentText, getResponseCode)
- `Session` - getActiveUser, getEffectiveUser, getScriptTimeZone
- `HtmlService` - createHtmlOutput, createHtmlOutputFromFile (chainable setTitle/setWidth/setHeight)
- `ContentService` - createTextOutput (chainable setMimeType), MimeType constants

## Mock Patterns

SpreadsheetApp uses a chainable builder pattern:
```typescript
SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().getRange('A1').setValue('test');
```

Reset mocks between tests with `jest.clearAllMocks()` in `beforeEach`.

Override mock return values per test:
```typescript
(PropertiesService.getScriptProperties as jest.Mock).mockReturnValue({
  getProperty: jest.fn(() => 'mocked_value'),
});
```

## Naming Convention

Use Japanese descriptions in describe/it blocks:
```typescript
describe('formatDate', () => {
  it('日付を YYYY-MM-DD 形式でフォーマットする', () => { ... });
});
```

## Coverage

Threshold: 70% for branches, functions, lines, and statements.
Coverage excludes: `src/**/*.d.ts`, `src/main.ts` (entry point), and `src/handlers/**/*.ts` (GAS entry points).

## JDBC Mocks

`Jdbc` mock in `gas-mocks.ts` provides `__createConnection(rows?)` and `__createResultSet(rows?)` factories:

```typescript
const conn = (Jdbc as any).__createConnection([{ id: '1', name: 'alpha' }]);
(Jdbc.getCloudSqlConnection as jest.Mock).mockReturnValue(conn);
const rows = executeQuery(conn, 'SELECT * FROM users WHERE id = ?', [1]);
// conn.prepareStatement / statement.setObject are jest.fn() and can be inspected
```

## Secrets Mocks

`PropertiesService.getScriptProperties().setProperty(key, value)` sets values in the in-memory store.
Always call `Secrets.clearCache()` in `beforeEach` to reset the execution-local cache.

## Logger Mocks

`Logger.log` is a `jest.fn()`. Parse its call arg with `JSON.parse` to inspect structured entries:

```typescript
const entry = JSON.parse((Logger.log as jest.Mock).mock.calls[0][0]);
expect(entry.level).toBe('ERROR');
```

## Commands

```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
npm test -- --coverage      # Alias with coverage
npm run lint                # ESLint check
npm run format              # Prettier format
```
