import { MissingSecretError } from '../../../src/lib/errors';
import { Secrets } from '../../../src/lib/secrets';

describe('Secrets', () => {
  beforeEach(() => {
    Secrets.clearCache();
  });

  it('getRequired returns transformed value when present', () => {
    PropertiesService.getScriptProperties().setProperty('API_TIMEOUT', '30');

    expect(Secrets.getRequired('API_TIMEOUT', Number)).toBe(30);
  });

  it('getRequired throws MissingSecretError when key is missing', () => {
    expect(() => Secrets.getRequired('MISSING_KEY')).toThrow(MissingSecretError);
  });

  it('getOptional returns defaultValue when key is absent', () => {
    expect(Secrets.getOptional('OPTIONAL_KEY', 'fallback')).toBe('fallback');
  });

  it('validateAll passes when all keys are present', () => {
    const properties = PropertiesService.getScriptProperties();
    properties.setProperties({ ONE: '1', TWO: '2' });

    expect(() => Secrets.validateAll(['ONE', 'TWO'])).not.toThrow();
  });

  it('validateAll throws when any key is missing', () => {
    PropertiesService.getScriptProperties().setProperty('ONE', '1');

    expect(() => Secrets.validateAll(['ONE', 'TWO'])).toThrow(MissingSecretError);
  });

  it('caches values so PropertiesService is called once per key', () => {
    const properties = PropertiesService.getScriptProperties();
    properties.setProperty('TOKEN', 'initial');

    expect(Secrets.getRequired('TOKEN')).toBe('initial');
    properties.setProperty('TOKEN', 'changed');
    expect(Secrets.getRequired('TOKEN')).toBe('initial');
    expect(properties.getProperty).toHaveBeenCalledTimes(1);
  });

  it('getOptional returns transformed value when key is present', () => {
    PropertiesService.getScriptProperties().setProperty('RETRY_COUNT', '3');

    expect(Secrets.getOptional('RETRY_COUNT', 1, Number)).toBe(3);
  });
});
