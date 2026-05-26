export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: keyof typeof LogLevel;
  name: string;
  message: string;
  context?: unknown;
}

export interface Logger {
  log(level: LogLevel | keyof typeof LogLevel | string, message: string, context?: unknown): void;
  debug(message: string, context?: unknown): void;
  info(message: string, context?: unknown): void;
  warn(message: string, context?: unknown): void;
  error(message: string, context?: unknown): void;
}

const DEFAULT_LEVEL = LogLevel.INFO;
const REDACTED = '***';
const SECRET_KEY_PATTERN =
  /(password|passwd|token|secret|api[_-]?key|authorization|auth|credential|private[_-]?key|access[_-]?key|client[_-]?secret|bearer)/i;

const getConfiguredLevel = (): LogLevel => {
  try {
    const configured = PropertiesService.getScriptProperties().getProperty('LOG_LEVEL');
    return configured ? normalizeLevel(configured) : DEFAULT_LEVEL;
  } catch (_error) {
    return DEFAULT_LEVEL;
  }
};

const appendToSheet = (entry: LogEntry): void => {
  // スプレッドシート出力はベストエフォート。スタンドアロン実行や権限不足では失敗するため、握りつぶす。
  try {
    const sheetName = PropertiesService.getScriptProperties().getProperty('LOG_SHEET_NAME');
    if (!sheetName) {
      return;
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      return;
    }
    const sheet = spreadsheet.getSheetByName(sheetName) ?? spreadsheet.insertSheet(sheetName);
    sheet.appendRow([
      entry.timestamp,
      entry.level,
      entry.name,
      entry.message,
      entry.context === undefined ? '' : safeStringify(entry.context),
    ]);
  } catch (_error) {
    // sheet logging is best-effort
  }
};

const normalizeLevel = (level: LogLevel | keyof typeof LogLevel | string): LogLevel => {
  if (typeof level === 'number') {
    return level;
  }

  const upper = level.toUpperCase();
  if (upper in LogLevel) {
    return LogLevel[upper as keyof typeof LogLevel];
  }

  return DEFAULT_LEVEL;
};

/**
 * シークレット系のキー（password / token / api_key 等）の値を `***` に置換する。
 * オブジェクト・配列は再帰的にトラバースする。循環参照は `[Circular]` に置換する。
 */
const redactSecrets = (value: unknown, seen: WeakSet<object> = new WeakSet()): unknown => {
  if (value === null || value === undefined) {
    return value;
  }
  // Error は name/message/stack が non-enumerable なので、明示的に取り出す。
  // 通常の object 走査だと JSON.stringify で空オブジェクトになってしまうため。
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  if (Array.isArray(value)) {
    return value.map((v) => redactSecrets(v, seen));
  }
  if (typeof value === 'object') {
    if (seen.has(value as object)) {
      return '[Circular]';
    }
    seen.add(value as object);
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEY_PATTERN.test(key)) {
        result[key] = REDACTED;
      } else {
        result[key] = redactSecrets(val, seen);
      }
    }
    return result;
  }
  return value;
};

const safeStringify = (value: unknown): string => {
  try {
    return JSON.stringify(value);
  } catch (_error) {
    return '[Unserializable]';
  }
};

export const createLogger = (name = 'app'): Logger => {
  const log: Logger['log'] = (level, message, context) => {
    const normalizedLevel = normalizeLevel(level);
    if (normalizedLevel < getConfiguredLevel()) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[normalizedLevel] as keyof typeof LogLevel,
      name,
      message,
      context: context === undefined ? undefined : redactSecrets(context),
    };

    try {
      globalThis.Logger.log(JSON.stringify(entry));
    } catch (_error) {
      // Logger 経由の出力失敗はサイレントに無視（テスト環境などで Logger が未定義の場合に備える）
    }
    appendToSheet(entry);
  };

  return {
    log,
    debug: (message, context) => log(LogLevel.DEBUG, message, context),
    info: (message, context) => log(LogLevel.INFO, message, context),
    warn: (message, context) => log(LogLevel.WARN, message, context),
    error: (message, context) => log(LogLevel.ERROR, message, context),
  };
};

export const getLogger = (name?: string): Logger => createLogger(name);

const logger = getLogger();
export default logger;
