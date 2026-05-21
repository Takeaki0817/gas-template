import { config } from '../config/settings';
import { getLogger } from '../lib/logger';

const logger = getLogger('handlers.http');

/**
 * Web app の GET リクエストハンドラ実装。
 *
 * クエリパラメータの値そのものはログに出さず、キー名のみを記録する。
 * パラメータ値にトークン・署名等が含まれる場合の情報漏洩を防ぐため。
 */
export function handleDoGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput {
  logger.info('doGet が呼び出されました', {
    parameterKeys: Object.keys(e.parameter ?? {}),
  });

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
 * Web app の POST リクエストハンドラ実装。
 *
 * postData の中身（本文）はログに出さず、メタ情報のみ記録する。
 * Webhook ペイロードに署名・PII が含まれる可能性があるため。
 *
 * ── 副作用がある処理を doPost に書く場合の指針 ─────────────────
 * 外部から POST が並行して飛んでくる可能性があるため、共有リソース（同一シート行・
 * Cloud SQL の同一レコード等）に書き込む処理は `LockService.tryLock` で排他制御する:
 *
 *   const lock = LockService.getScriptLock();
 *   if (!lock.tryLock(10000)) {
 *     return ContentService.createTextOutput(JSON.stringify({ status: 'busy' }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 *   try {
 *     // 共有リソース更新
 *   } finally {
 *     lock.releaseLock();
 *   }
 */
export function handleDoPost(
  e: GoogleAppsScript.Events.DoPost
): GoogleAppsScript.Content.TextOutput {
  logger.info('doPost が呼び出されました', {
    contentType: e.postData?.type,
    contentLength: e.postData?.length,
  });

  const response = {
    status: 'success',
    message: 'リクエストを受信しました',
    timestamp: new Date().toISOString(),
  };

  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(
    ContentService.MimeType.JSON
  );
}
