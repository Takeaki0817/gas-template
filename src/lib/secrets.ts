import { MissingSecretError } from './errors';

type Transformer<T> = (value: string) => T;

const cache = new Map<string, string | null>();

const getCachedSecret = (key: string): string | null => {
  if (cache.has(key)) {
    return cache.get(key) ?? null;
  }
  const value = PropertiesService.getScriptProperties().getProperty(key);
  cache.set(key, value);
  return value;
};

/**
 * 必須シークレットを Script Properties から取得する。
 *
 * 値は Apps Script の実行ごとにメモリキャッシュされ、同一キーへの繰り返し参照は
 * PropertiesService を再フェッチしない。
 *
 * @throws {MissingSecretError} プロパティが未設定または空文字の場合。
 */
export function getRequiredSecret(key: string): string;
export function getRequiredSecret<T>(key: string, transformer: Transformer<T>): T;
export function getRequiredSecret<T>(key: string, transformer?: Transformer<T>): T | string {
  const value = getCachedSecret(key);
  if (value === null || value === '') {
    throw new MissingSecretError(key);
  }
  return transformer ? transformer(value) : value;
}

/**
 * 任意シークレットを Script Properties から取得する。
 *
 * 未設定または空文字の場合は `defaultValue` を返す。値は実行内でキャッシュされる。
 */
export function getOptionalSecret(key: string, defaultValue: string): string;
export function getOptionalSecret<T>(key: string, defaultValue: T, transformer: Transformer<T>): T;
export function getOptionalSecret<T>(
  key: string,
  defaultValue: T,
  transformer?: Transformer<T>
): T {
  const value = getCachedSecret(key);
  if (value === null || value === '') {
    return defaultValue;
  }
  return transformer ? transformer(value) : (value as unknown as T);
}

/**
 * 起動時に必須キー一式の存在を検証する。
 *
 * @throws {MissingSecretError} 最初に欠けているキー。
 */
export const validateAllSecrets = (keys: string[]): void => {
  keys.forEach((key) => {
    getRequiredSecret(key);
  });
};

/**
 * 実行内シークレットキャッシュをクリアする。主にテスト用途。
 */
export const clearSecretsCache = (): void => {
  cache.clear();
};
