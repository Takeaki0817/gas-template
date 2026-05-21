/**
 * Google Apps Script グローバル型定義
 */

/**
 * グローバルオブジェクトの型拡張
 * GASで関数を公開するために使用
 */
declare const global: {
  [key: string]: unknown;
};

/**
 * プロジェクト固有の型定義
 */

// 設定オブジェクトの型
export interface AppConfig {
  appName: string;
  version: string;
  environment: 'development' | 'production';
}

// ログレベルの型
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
