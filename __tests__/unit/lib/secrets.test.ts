import { MissingSecretError } from '../../../src/lib/errors';
import {
  clearSecretsCache,
  getOptionalSecret,
  getRequiredSecret,
  validateAllSecrets,
} from '../../../src/lib/secrets';

describe('secrets', () => {
  beforeEach(() => {
    clearSecretsCache();
  });

  it('getRequiredSecret は transformer を適用した値を返す', () => {
    PropertiesService.getScriptProperties().setProperty('API_TIMEOUT', '30');

    expect(getRequiredSecret('API_TIMEOUT', Number)).toBe(30);
  });

  it('getRequiredSecret は未設定のキーで MissingSecretError を投げる', () => {
    expect(() => getRequiredSecret('MISSING_KEY')).toThrow(MissingSecretError);
  });

  it('getRequiredSecret は空文字を未設定として扱い MissingSecretError を投げる', () => {
    PropertiesService.getScriptProperties().setProperty('EMPTY', '');

    expect(() => getRequiredSecret('EMPTY')).toThrow(MissingSecretError);
  });

  it('getOptionalSecret はキーがなければ defaultValue を返す', () => {
    expect(getOptionalSecret('OPTIONAL_KEY', 'fallback')).toBe('fallback');
  });

  it('getOptionalSecret は空文字を未設定として扱い defaultValue を返す', () => {
    PropertiesService.getScriptProperties().setProperty('EMPTY_OPT', '');

    expect(getOptionalSecret('EMPTY_OPT', 'fallback')).toBe('fallback');
  });

  it('validateAllSecrets は全キーが揃っていれば例外を投げない', () => {
    const properties = PropertiesService.getScriptProperties();
    properties.setProperties({ ONE: '1', TWO: '2' });

    expect(() => validateAllSecrets(['ONE', 'TWO'])).not.toThrow();
  });

  it('validateAllSecrets は欠けているキーがあれば MissingSecretError を投げる', () => {
    PropertiesService.getScriptProperties().setProperty('ONE', '1');

    expect(() => validateAllSecrets(['ONE', 'TWO'])).toThrow(MissingSecretError);
  });

  it('値をキャッシュし PropertiesService への問い合わせはキーごとに 1 回だけ行う', () => {
    const properties = PropertiesService.getScriptProperties();
    properties.setProperty('TOKEN', 'initial');

    expect(getRequiredSecret('TOKEN')).toBe('initial');
    properties.setProperty('TOKEN', 'changed');
    expect(getRequiredSecret('TOKEN')).toBe('initial');
    expect(properties.getProperty).toHaveBeenCalledTimes(1);
  });

  it('getOptionalSecret はキーが存在すれば transformer を適用した値を返す', () => {
    PropertiesService.getScriptProperties().setProperty('RETRY_COUNT', '3');

    expect(getOptionalSecret('RETRY_COUNT', 1, Number)).toBe(3);
  });
});
