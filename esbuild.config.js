const esbuild = require('esbuild');
const { GasPlugin } = require('esbuild-gas-plugin');

const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'dist/Code.js',
  plugins: [GasPlugin],
  logLevel: 'info',
  minify: false, // GASのデバッグを容易にするためminifyは無効化
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
