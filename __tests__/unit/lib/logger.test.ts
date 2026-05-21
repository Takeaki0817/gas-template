import { getLogger, LogLevel } from '../../../src/lib/logger';

describe('Logger', () => {
  it('LOG_LEVEL=WARN filters out DEBUG and INFO messages', () => {
    PropertiesService.getScriptProperties().setProperty('LOG_LEVEL', 'WARN');
    const logger = getLogger('test');

    logger.log(LogLevel.DEBUG, 'debug');
    logger.log(LogLevel.INFO, 'info');
    logger.log(LogLevel.WARN, 'warn');

    expect(Logger.log).toHaveBeenCalledTimes(1);
    expect(JSON.parse((Logger.log as jest.Mock).mock.calls[0][0])).toMatchObject({ level: 'WARN', message: 'warn' });
  });

  it('LOG_LEVEL=DEBUG passes all levels', () => {
    PropertiesService.getScriptProperties().setProperty('LOG_LEVEL', 'DEBUG');
    const logger = getLogger('test');

    logger.debug('debug');
    logger.info('info');
    logger.warn('warn');
    logger.error('error');

    expect(Logger.log).toHaveBeenCalledTimes(4);
  });

  it('writes structured rows to a configured log sheet', () => {
    PropertiesService.getScriptProperties().setProperties({ LOG_LEVEL: 'DEBUG', LOG_SHEET_NAME: 'Logs' });
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const logger = getLogger('sheet-test');

    logger.info('created', { id: 1 });

    const sheet = spreadsheet.getSheetByName('Logs');
    expect(sheet?.appendRow).toHaveBeenCalledWith(expect.arrayContaining(['INFO', 'sheet-test', 'created', '{"id":1}']));
  });

  it('does not touch SpreadsheetApp when sheet output is disabled', () => {
    PropertiesService.getScriptProperties().setProperty('LOG_LEVEL', 'DEBUG');

    getLogger('no-sheet').info('message');

    expect(SpreadsheetApp.getActiveSpreadsheet).not.toHaveBeenCalled();
  });

  it('structured format includes timestamp, level, message, and context', () => {
    PropertiesService.getScriptProperties().setProperty('LOG_LEVEL', 'DEBUG');

    getLogger('format').warn('careful', { job: 'sync' });

    const entry = JSON.parse((Logger.log as jest.Mock).mock.calls[0][0]);
    expect(entry).toEqual(expect.objectContaining({
      level: 'WARN',
      name: 'format',
      message: 'careful',
      context: { job: 'sync' },
    }));
    expect(entry.timestamp).toEqual(expect.any(String));
  });

  it('error レベルのログを出力できる', () => {
    PropertiesService.getScriptProperties().setProperty('LOG_LEVEL', 'DEBUG');
    const logger = getLogger('error-test');

    logger.error('something failed', { reason: 'timeout' });

    expect(Logger.log).toHaveBeenCalledTimes(1);
    const entry = JSON.parse((Logger.log as jest.Mock).mock.calls[0][0]);
    expect(entry.level).toBe('ERROR');
  });

  it('creates a new sheet when LOG_SHEET_NAME sheet does not exist', () => {
    PropertiesService.getScriptProperties().setProperties({
      LOG_LEVEL: 'DEBUG',
      LOG_SHEET_NAME: 'NewLogs',
    });
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    (spreadsheet.getSheetByName as jest.Mock).mockReturnValue(null);
    const logger = getLogger('new-sheet');

    logger.info('create sheet test');

    expect(spreadsheet.insertSheet).toHaveBeenCalledWith('NewLogs');
  });

  describe('シークレットレダクション', () => {
    beforeEach(() => {
      PropertiesService.getScriptProperties().setProperty('LOG_LEVEL', 'DEBUG');
    });

    it('password / token / api_key などのキーの値を *** に置換する', () => {
      getLogger('redact').info('login', {
        userId: 'u1',
        password: 'p@ssw0rd',
        token: 'abc.def',
        api_key: 'sk-xxx',
        authorization: 'Bearer xxx',
      });

      const entry = JSON.parse((Logger.log as jest.Mock).mock.calls[0][0]);
      expect(entry.context).toEqual({
        userId: 'u1',
        password: '***',
        token: '***',
        api_key: '***',
        authorization: '***',
      });
    });

    it('ネストされたオブジェクト内のシークレットも再帰的に置換する', () => {
      getLogger('redact').info('nested', {
        user: { id: 'u1', secret: 'shhh' },
        list: [{ apiKey: 'k1' }, { name: 'plain' }],
      });

      const entry = JSON.parse((Logger.log as jest.Mock).mock.calls[0][0]);
      expect(entry.context).toEqual({
        user: { id: 'u1', secret: '***' },
        list: [{ apiKey: '***' }, { name: 'plain' }],
      });
    });

    it('循環参照を含むオブジェクトでもクラッシュしない', () => {
      const obj: Record<string, unknown> = { name: 'a' };
      obj.self = obj;

      expect(() => getLogger('cycle').info('circular', obj)).not.toThrow();
      expect(Logger.log).toHaveBeenCalledTimes(1);
    });

    it('Error インスタンスは name / message / stack に展開される', () => {
      const err = new Error('boom');
      getLogger('err').error('caught', err);

      const entry = JSON.parse((Logger.log as jest.Mock).mock.calls[0][0]);
      expect(entry.context).toEqual(
        expect.objectContaining({
          name: 'Error',
          message: 'boom',
          stack: expect.any(String),
        })
      );
    });

    it('ネストされた Error も展開される', () => {
      getLogger('nested-err').error('caught', {
        op: 'sync',
        cause: new TypeError('bad type'),
      });

      const entry = JSON.parse((Logger.log as jest.Mock).mock.calls[0][0]);
      expect(entry.context.op).toBe('sync');
      expect(entry.context.cause).toEqual(
        expect.objectContaining({ name: 'TypeError', message: 'bad type' })
      );
    });
  });

  describe('GAS API のフォールバック', () => {
    it('SpreadsheetApp が例外を投げてもログ出力は失敗しない', () => {
      PropertiesService.getScriptProperties().setProperties({
        LOG_LEVEL: 'DEBUG',
        LOG_SHEET_NAME: 'Logs',
      });
      (SpreadsheetApp.getActiveSpreadsheet as jest.Mock).mockImplementationOnce(() => {
        throw new Error('no spreadsheet bound');
      });

      expect(() => getLogger('fallback').info('still works')).not.toThrow();
      expect(Logger.log).toHaveBeenCalledTimes(1);
    });
  });
});
