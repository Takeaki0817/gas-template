module.exports = {
  // ts-jestを使用してTypeScriptをテスト
  preset: 'ts-jest',

  // Node.js環境でテストを実行
  testEnvironment: 'node',

  // テストファイルの検索ルート
  roots: [
    '<rootDir>/__tests__',
    '<rootDir>/src'
  ],

  // テストファイルのパターン
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts'
  ],

  // 対応するファイル拡張子
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],

  // カバレッジ収集対象
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',  // エントリーポイントは除外
  ],

  // カバレッジ出力先
  coverageDirectory: 'coverage',

  // カバレッジレポート形式
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html'
  ],

  // カバレッジ閾値（オプション）
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // ts-jestの設定
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      }
    }
  },

  // セットアップファイル（モックの初期化など）
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],

  // テストタイムアウト（ミリ秒）
  testTimeout: 10000,

  // 詳細な出力
  verbose: true,
};
