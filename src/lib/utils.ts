import type { LogLevel } from '../types/global';
import logger, { LogLevel as LoggerLevel } from './logger';

/**
 * ユーティリティ関数集
 */

/**
 * ログ出力ヘルパー
 */
export function log(level: LogLevel, message: string, data?: unknown): void {
  logger.log(toLoggerLevel(level), message, data);
}

/**
 * 日付を YYYY-MM-DD 形式にフォーマット
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * スリープ関数（ミリ秒単位）
 */
export function sleep(milliseconds: number): void {
  Utilities.sleep(milliseconds);
}

/**
 * 配列をチャンクに分割
 */
export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) {
    throw new Error('Chunk size must be greater than 0');
  }

  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * オブジェクトの深いコピー（JSON-safe な値のみ対応）
 *
 * 注意: 以下の値は失われる、または別形式に変換される:
 * - `Date` → ISO 文字列に変換される
 * - `Map` / `Set` → 空オブジェクト `{}` になる
 * - `undefined` のプロパティ → 削除される
 * - 関数 / `Symbol` / `BigInt` → 削除またはエラー
 *
 * これらを含む可能性がある値は、専用の clone 実装を別途用意すること。
 */
export function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * ランダムな文字列を生成
 */
export function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join('');
}

const toLoggerLevel = (level: LogLevel): LoggerLevel => {
  switch (level) {
    case 'debug':
      return LoggerLevel.DEBUG;
    case 'warn':
      return LoggerLevel.WARN;
    case 'error':
      return LoggerLevel.ERROR;
    case 'info':
    default:
      return LoggerLevel.INFO;
  }
};
