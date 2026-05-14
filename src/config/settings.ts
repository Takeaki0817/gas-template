import type { AppConfig } from '../types/global';

/**
 * アプリケーション設定
 */
export const config: AppConfig = {
  appName: 'GAS Template Project',
  version: '1.0.0',
  environment: 'development',
};

/**
 * 環境変数の取得
 * PropertiesServiceを使用してスクリプトプロパティから取得
 */
export function getEnvVar(key: string, defaultValue = ''): string {
  try {
    const value = PropertiesService.getScriptProperties().getProperty(key);
    return value ?? defaultValue;
  } catch (error) {
    Logger.log(`環境変数 ${key} の取得に失敗: ${error}`);
    return defaultValue;
  }
}

/**
 * 環境変数の設定
 */
export function setEnvVar(key: string, value: string): void {
  try {
    PropertiesService.getScriptProperties().setProperty(key, value);
    Logger.log(`環境変数 ${key} を設定しました`);
  } catch (error) {
    Logger.log(`環境変数 ${key} の設定に失敗: ${error}`);
  }
}
