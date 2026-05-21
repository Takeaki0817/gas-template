import { MissingSecretError } from './errors';

type Transformer<T> = (value: string) => T;

const cache = new Map<string, string | null>();

/**
 * Cached access to script-level secrets stored in PropertiesService.
 */
export class Secrets {
  /**
   * Fetch a required secret from Script Properties.
   *
   * Values are cached in memory for the current Apps Script execution so repeated
   * calls for the same key do not re-fetch from PropertiesService.
   *
   * @param key Script property key.
   * @param transformer Optional converter from raw string to the requested type.
   * @throws MissingSecretError when the property is absent or empty.
   */
  static getRequired<T = string>(key: string, transformer?: Transformer<T>): T {
    const value = getCachedSecret(key);

    if (value === null || value === '') {
      throw new MissingSecretError(key);
    }

    return transformValue(value, transformer);
  }

  /**
   * Fetch an optional secret from Script Properties.
   *
   * Missing or empty values return the provided default value. Present values are
   * cached for the current execution.
   *
   * @param key Script property key.
   * @param defaultValue Value returned when the property is absent or empty.
   * @param transformer Optional converter from raw string to the requested type.
   */
  static getOptional<T = string>(key: string, defaultValue: T, transformer?: Transformer<T>): T {
    const value = getCachedSecret(key);

    if (value === null || value === '') {
      return defaultValue;
    }

    return transformValue(value, transformer);
  }

  /**
   * Validate that every required key exists before running startup work.
   *
   * @param keys Script property keys that must be present.
   * @throws MissingSecretError for the first missing key.
   */
  static validateAll(keys: string[]): void {
    keys.forEach((key) => {
      Secrets.getRequired(key);
    });
  }

  /**
   * Clear the execution-local cache. Primarily useful for tests.
   */
  static clearCache(): void {
    cache.clear();
  }
}

export const secrets = Secrets;

function getCachedSecret(key: string): string | null {
  if (cache.has(key)) {
    return cache.get(key) ?? null;
  }

  const value = PropertiesService.getScriptProperties().getProperty(key);
  cache.set(key, value);
  return value;
}

function transformValue<T>(value: string, transformer?: Transformer<T>): T {
  return transformer ? transformer(value) : (value as T);
}
