/**
 * Google Apps Script メインエントリーポイント
 *
 * このファイルでGASのグローバル関数を定義します。
 * esbuild-gas-pluginがグローバルオブジェクトへの登録を処理します。
 */

import { config } from './config/settings';
import { log, formatDate } from './lib/utils';

/**
 * スクリプトの初期化関数
 * スプレッドシートやドキュメントを開いたときに実行される
 */
function onOpen(): void {
  // Spreadsheetsの場合
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('カスタムメニュー')
      .addItem('✨ サンプル関数を実行', 'myFunction')
      .addItem('📊 データを処理', 'processData')
      .addItem('ℹ️ バージョン情報', 'showVersion')
      .addToUi();

    log('info', 'カスタムメニューを作成しました');
  } catch (error) {
    // Spreadsheetsでない場合はスキップ
    log('info', 'onOpen: スプレッドシート環境ではありません');
  }
}

/**
 * サンプル関数
 * メニューから実行可能
 */
function myFunction(): void {
  log('info', 'myFunction が実行されました', { config });

  const today = formatDate(new Date());
  const message = `こんにちは！今日は ${today} です。`;

  // スプレッドシートの場合
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.getRange('A1').setValue(message);
    SpreadsheetApp.getUi().alert(message);
  } catch (error) {
    Logger.log(message);
  }
}

/**
 * データ処理のサンプル関数
 */
function processData(): void {
  log('info', 'データ処理を開始します');

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {
      SpreadsheetApp.getUi().alert('処理するデータがありません');
      return;
    }

    // データの取得と処理の例
    const range = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
    const values = range.getValues();

    log('info', `${values.length} 行のデータを処理しました`);
    SpreadsheetApp.getUi().alert(`${values.length} 行のデータを処理しました`);
  } catch (error) {
    log('error', 'データ処理中にエラーが発生しました', error);
    throw error;
  }
}

/**
 * バージョン情報を表示
 */
function showVersion(): void {
  const message = `${config.appName}\nバージョン: ${config.version}\n環境: ${config.environment}`;

  try {
    SpreadsheetApp.getUi().alert('バージョン情報', message, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (error) {
    Logger.log(message);
  }
}

/**
 * Web アプリとしてデプロイする場合の GET リクエストハンドラ
 */
function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput {
  log('info', 'doGet が呼び出されました', { parameters: e.parameter });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <meta charset="utf-8">
        <title>${config.appName}</title>
      </head>
      <body>
        <h1>${config.appName}</h1>
        <p>バージョン: ${config.version}</p>
        <p>現在時刻: ${new Date().toLocaleString('ja-JP')}</p>
      </body>
    </html>
  `;

  return HtmlService.createHtmlOutput(html);
}

/**
 * Web アプリとしてデプロイする場合の POST リクエストハンドラ
 */
function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  log('info', 'doPost が呼び出されました', { postData: e.postData });

  const response = {
    status: 'success',
    message: 'リクエストを受信しました',
    timestamp: new Date().toISOString(),
  };

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 時間駆動型トリガーのサンプル
 * トリガーは手動で設定する必要があります
 */
function scheduledFunction(): void {
  log('info', '定期実行関数が実行されました');
  // 定期的に実行したい処理をここに記述
}

// グローバルオブジェクトへの登録
// esbuild-gas-plugin が自動的に処理するため、明示的な登録は不要
// ただし、TypeScript の型チェックを通すために declare を使用
declare const global: {
  onOpen: typeof onOpen;
  myFunction: typeof myFunction;
  processData: typeof processData;
  showVersion: typeof showVersion;
  doGet: typeof doGet;
  doPost: typeof doPost;
  scheduledFunction: typeof scheduledFunction;
};

global.onOpen = onOpen;
global.myFunction = myFunction;
global.processData = processData;
global.showVersion = showVersion;
global.doGet = doGet;
global.doPost = doPost;
global.scheduledFunction = scheduledFunction;
