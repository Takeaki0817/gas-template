const esbuild = require('esbuild');
const { GasPlugin } = require('esbuild-gas-plugin');

const isWatch = process.argv.includes('--watch');

// ビルド日時を JST で生成
const buildDateTime = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

const buildOptions = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'dist/Code.js',
  plugins: [GasPlugin],
  logLevel: 'info',
  minify: false, // GASのデバッグを容易にするためminifyは無効化
  banner: {
    js: `/**
 * ⚠️ 警告: このファイルは自動生成されています
 *
 * 直接このファイルを編集しないでください。
 * 編集する場合は、以下のリポジトリを利用してください:
 * https://github.com/TOMAP-Inc/gas-template
 *
 * ビルド日時: ${buildDateTime} JST
 */`,
  },
};

if (isWatch) {
  esbuild
    .context(buildOptions)
    .then((ctx) => {
      console.log('👀 ファイルを監視中...');
      return ctx.watch();
    })
    .catch(() => process.exit(1));
} else {
  esbuild
    .build(buildOptions)
    .then(() => console.log('✅ ビルド完了'))
    .catch(() => process.exit(1));
}
