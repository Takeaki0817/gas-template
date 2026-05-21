/**
 * Settings モジュールのユニットテスト
 */

import { config, getEnvVar, setEnvVar } from '../../../src/config/settings';

describe('Settings Module', () => {
  describe('config', () => {
    it('デフォルト設定が正しく定義されている', () => {
      expect(config).toBeDefined();
      expect(config.appName).toBe('GAS Template Project');
      expect(config.version).toBe('1.0.0');
      expect(config.environment).toBe('development');
    });

    it('設定オブジェクトのプロパティがすべて存在する', () => {
      expect(config).toHaveProperty('appName');
      expect(config).toHaveProperty('version');
      expect(config).toHaveProperty('environment');
    });
  });

  describe('getEnvVar', () => {
    beforeEach(() => {
      // モックをリセット
      jest.clearAllMocks();
    });

    it('環境変数が存在しない場合、デフォルト値を返す', () => {
      const mockGetProperty = jest.fn(() => null);
      (PropertiesService.getScriptProperties as jest.Mock).mockReturnValue({
        getProperty: mockGetProperty,
      });

      const result = getEnvVar('NON_EXISTENT_KEY', 'default_value');

      expect(result).toBe('default_value');
      expect(mockGetProperty).toHaveBeenCalledWith('NON_EXISTENT_KEY');
    });

    it('環境変数が存在する場合、その値を返す', () => {
      const mockGetProperty = jest.fn(() => 'test_value');
      (PropertiesService.getScriptProperties as jest.Mock).mockReturnValue({
        getProperty: mockGetProperty,
      });

      const result = getEnvVar('EXISTING_KEY', 'default_value');

      expect(result).toBe('test_value');
      expect(mockGetProperty).toHaveBeenCalledWith('EXISTING_KEY');
    });

    it('デフォルト値を指定しない場合、空文字列を返す', () => {
      const mockGetProperty = jest.fn(() => null);
      (PropertiesService.getScriptProperties as jest.Mock).mockReturnValue({
        getProperty: mockGetProperty,
      });

      const result = getEnvVar('KEY_WITHOUT_DEFAULT');

      expect(result).toBe('');
    });

    it('missing keys return an empty string when no default is provided', () => {
      const result = getEnvVar('ABSENT_KEY');

      expect(result).toBe('');
    });

    it('returns stored string values for type-like coercion cases', () => {
      PropertiesService.getScriptProperties().setProperties({
        NUMERIC: '123',
        BOOLEAN: 'false',
      });

      expect(getEnvVar('NUMERIC')).toBe('123');
      expect(getEnvVar('BOOLEAN')).toBe('false');
    });

    it('エラーが発生した場合、デフォルト値を返す', () => {
      const mockGetProperty = jest.fn(() => {
        throw new Error('PropertiesService error');
      });
      (PropertiesService.getScriptProperties as jest.Mock).mockReturnValue({
        getProperty: mockGetProperty,
      });

      const result = getEnvVar('ERROR_KEY', 'fallback');

      expect(result).toBe('fallback');
    });
  });

  describe('setEnvVar', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('環境変数を正しく設定する', () => {
      const mockSetProperty = jest.fn();
      (PropertiesService.getScriptProperties as jest.Mock).mockReturnValue({
        setProperty: mockSetProperty,
      });

      setEnvVar('TEST_KEY', 'test_value');

      expect(mockSetProperty).toHaveBeenCalledWith('TEST_KEY', 'test_value');
    });

    it('setEnvVar overwrites existing values', () => {
      const properties = PropertiesService.getScriptProperties();

      setEnvVar('OVERWRITE_KEY', 'first');
      setEnvVar('OVERWRITE_KEY', 'second');

      expect(properties.getProperty('OVERWRITE_KEY')).toBe('second');
    });

    it('エラーが発生しても例外をスローしない', () => {
      const mockSetProperty = jest.fn(() => {
        throw new Error('PropertiesService error');
      });
      (PropertiesService.getScriptProperties as jest.Mock).mockReturnValue({
        setProperty: mockSetProperty,
      });

      expect(() => {
        setEnvVar('ERROR_KEY', 'value');
      }).not.toThrow();
    });
  });
});
