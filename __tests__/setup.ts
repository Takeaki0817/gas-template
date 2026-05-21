/**
 * Jest セットアップファイル
 * すべてのテストの前に実行される
 */

// GAS APIモックをグローバルに読み込む
import { resetGasMocks } from './mocks/gas-mocks';

// テストのタイムゾーンを設定（GASと合わせる）
process.env.TZ = 'Asia/Tokyo';

// console出力をテスト時に制御
if (process.env.NODE_ENV === 'test') {
  // テスト中はLogger.logの出力を抑制
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: console.warn,
    error: console.error,
  };
}

beforeEach(() => {
  resetGasMocks();
});
