/**
 * HTTP ハンドラ (doGet / doPost) のユニットテスト
 */
import { handleDoGet, handleDoPost } from '../../../src/handlers/http';
import { config } from '../../../src/config/settings';

describe('handleDoGet', () => {
  beforeEach(() => {
    // ハンドラのログを Logger に通すため DEBUG にしておく
    PropertiesService.getScriptProperties().setProperty('LOG_LEVEL', 'DEBUG');
  });

  it('appName と version を含む HTML を返す', () => {
    const event = { parameter: {} } as unknown as GoogleAppsScript.Events.DoGet;

    const output = handleDoGet(event);
    const content = output.getContent();

    expect(content).toContain(config.appName);
    expect(content).toContain(config.version);
    expect(content).toContain('<!DOCTYPE html>');
    expect(HtmlService.createHtmlOutput).toHaveBeenCalledTimes(1);
  });

  it('クエリパラメータの値はログに出さず、キー名のみを記録する', () => {
    const event = {
      parameter: { token: 'secret-token-value', user: 'alice' },
    } as unknown as GoogleAppsScript.Events.DoGet;

    handleDoGet(event);

    const entry = JSON.parse((Logger.log as jest.Mock).mock.calls[0][0]);
    expect(entry.message).toBe('doGet が呼び出されました');
    expect(entry.context.parameterKeys).toEqual(['token', 'user']);
    // 値（secret-token-value）はログ全体のどこにも含まれない
    const allLogs = (Logger.log as jest.Mock).mock.calls.map((c) => c[0]).join('\n');
    expect(allLogs).not.toContain('secret-token-value');
    expect(allLogs).not.toContain('alice');
  });

  it('e.parameter が undefined でもクラッシュせず空のキー配列を記録する', () => {
    const event = {} as unknown as GoogleAppsScript.Events.DoGet;

    expect(() => handleDoGet(event)).not.toThrow();

    const entry = JSON.parse((Logger.log as jest.Mock).mock.calls[0][0]);
    expect(entry.context.parameterKeys).toEqual([]);
  });
});

describe('handleDoPost', () => {
  beforeEach(() => {
    PropertiesService.getScriptProperties().setProperty('LOG_LEVEL', 'DEBUG');
  });

  it('success ステータスと timestamp を含む JSON を返す', () => {
    const event = {
      postData: { type: 'application/json', length: 42, contents: '{"x":1}' },
    } as unknown as GoogleAppsScript.Events.DoPost;

    const output = handleDoPost(event);
    const body = JSON.parse(output.getContent());

    expect(body.status).toBe('success');
    expect(body.message).toBe('リクエストを受信しました');
    expect(typeof body.timestamp).toBe('string');
    expect(ContentService.createTextOutput).toHaveBeenCalledTimes(1);
  });

  it('JSON MimeType を設定する', () => {
    const event = {
      postData: { type: 'application/json', length: 10, contents: '{}' },
    } as unknown as GoogleAppsScript.Events.DoPost;

    const output = handleDoPost(event);
    const textOutput = (ContentService.createTextOutput as jest.Mock).mock.results[0].value;

    expect(textOutput.setMimeType).toHaveBeenCalledWith(ContentService.MimeType.JSON);
    // 返り値は setMimeType のチェーン結果
    expect(output).toBe(textOutput);
  });

  it('postData の本文（contents）はログに出さず、メタ情報のみ記録する', () => {
    const event = {
      postData: {
        type: 'application/json',
        length: 99,
        contents: '{"password":"p@ss","ssn":"123-45-6789"}',
      },
    } as unknown as GoogleAppsScript.Events.DoPost;

    handleDoPost(event);

    const entry = JSON.parse((Logger.log as jest.Mock).mock.calls[0][0]);
    expect(entry.message).toBe('doPost が呼び出されました');
    expect(entry.context).toEqual({ contentType: 'application/json', contentLength: 99 });

    const allLogs = (Logger.log as jest.Mock).mock.calls.map((c) => c[0]).join('\n');
    expect(allLogs).not.toContain('p@ss');
    expect(allLogs).not.toContain('123-45-6789');
  });

  it('e.postData が undefined でもクラッシュせず undefined メタを記録する', () => {
    const event = {} as unknown as GoogleAppsScript.Events.DoPost;

    expect(() => handleDoPost(event)).not.toThrow();

    const entry = JSON.parse((Logger.log as jest.Mock).mock.calls[0][0]);
    expect(entry.context.contentType).toBeUndefined();
    expect(entry.context.contentLength).toBeUndefined();
  });
});
