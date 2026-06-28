/**
 * 時間駆動トリガーハンドラのユニットテスト
 */
import { handleScheduledFunction } from '../../../src/handlers/scheduled';

describe('handleScheduledFunction', () => {
  beforeEach(() => {
    PropertiesService.getScriptProperties().setProperty('LOG_LEVEL', 'DEBUG');
  });

  it('例外を投げずに正常終了する', () => {
    expect(() => handleScheduledFunction()).not.toThrow();
  });

  it('実行開始を示すログを 1 回出力する', () => {
    handleScheduledFunction();

    expect(Logger.log).toHaveBeenCalledTimes(1);
    const entry = JSON.parse((Logger.log as jest.Mock).mock.calls[0][0]);
    expect(entry).toMatchObject({
      level: 'INFO',
      name: 'handlers.scheduled',
      message: '定期実行関数が実行されました',
    });
  });

  it('LOG_LEVEL=WARN のときは INFO ログが抑制される', () => {
    PropertiesService.getScriptProperties().setProperty('LOG_LEVEL', 'WARN');

    handleScheduledFunction();

    expect(Logger.log).not.toHaveBeenCalled();
  });
});
