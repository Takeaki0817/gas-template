import { runWithContinuation } from '../../../src/lib/long-running';

describe('runWithContinuation', () => {
  const stateKey = 'CONTINUATION_STATE_syncJob';

  it('processes all items in one run without creating a trigger', () => {
    const processed: number[] = [];

    runWithContinuation('syncJob', [1, 2, 3], (item) => processed.push(item));

    expect(processed).toEqual([1, 2, 3]);
    expect(PropertiesService.getScriptProperties().getProperty(stateKey)).toBeNull();
    expect(ScriptApp.newTrigger).not.toHaveBeenCalled();
  });

  it('saves pending state and creates trigger on timeout', () => {
    const nowSpy = jest.spyOn(Date, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(11);
    const processed: number[] = [];

    runWithContinuation('syncJob', [1, 2, 3], (item) => processed.push(item), {
      maxExecMs: 10,
      triggerFunctionName: 'continueSync',
    });

    expect(processed).toEqual([1]);
    expect(JSON.parse(PropertiesService.getScriptProperties().getProperty(stateKey) ?? '{}')).toEqual({
      items: [1, 2, 3],
      nextIndex: 1,
    });
    expect(ScriptApp.newTrigger).toHaveBeenCalledWith('continueSync');
    nowSpy.mockRestore();
  });

  it('resumes from saved index, completes, deletes trigger, and cleans state', () => {
    const properties = PropertiesService.getScriptProperties();
    properties.setProperty(stateKey, JSON.stringify({ items: [1, 2, 3], nextIndex: 1 }));
    const trigger = ScriptApp.newTrigger('continueSync').timeBased().after(1).everyMinutes(1).create();
    const processed: number[] = [];

    runWithContinuation('syncJob', [9, 9, 9], (item) => processed.push(item), {
      triggerFunctionName: 'continueSync',
    });

    expect(processed).toEqual([2, 3]);
    expect(properties.getProperty(stateKey)).toBeNull();
    expect(ScriptApp.deleteTrigger).toHaveBeenCalledWith(trigger);
  });

  it('preserves pending state and schedules continuation when processItem throws', () => {
    const error = new Error('boom');

    expect(() => runWithContinuation('syncJob', [1, 2], (item) => {
      if (item === 1) {
        throw error;
      }
    }, { triggerFunctionName: 'continueSync' })).toThrow(error);

    expect(JSON.parse(PropertiesService.getScriptProperties().getProperty(stateKey) ?? '{}')).toEqual({
      items: [1, 2],
      nextIndex: 0,
    });
    expect(ScriptApp.newTrigger).toHaveBeenCalledWith('continueSync');
  });

  it('継続トリガーはワンショット (.after のみ、.everyMinutes は呼ばない)', () => {
    const nowSpy = jest.spyOn(Date, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(11);

    runWithContinuation('syncJob', [1, 2], () => undefined, {
      maxExecMs: 10,
      triggerFunctionName: 'continueSync',
    });

    const builder = (ScriptApp.newTrigger as jest.Mock).mock.results[0].value;
    expect(builder.after).toHaveBeenCalledWith(60 * 1000);
    expect(builder.everyMinutes).not.toHaveBeenCalled();
    nowSpy.mockRestore();
  });

  it('continueAfterMs option overrides the default trigger delay', () => {
    const nowSpy = jest.spyOn(Date, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(11);

    runWithContinuation('syncJob', [1, 2], () => undefined, {
      maxExecMs: 10,
      triggerFunctionName: 'continueSync',
      continueAfterMs: 5000,
    });

    const builder = (ScriptApp.newTrigger as jest.Mock).mock.results[0].value;
    expect(builder.after).toHaveBeenCalledWith(5000);
    nowSpy.mockRestore();
  });

  it('破損した保存 state は捨ててリセットする', () => {
    const properties = PropertiesService.getScriptProperties();
    properties.setProperty(stateKey, '{not json');
    const processed: number[] = [];

    runWithContinuation('syncJob', [1, 2], (item) => processed.push(item));

    expect(processed).toEqual([1, 2]);
    expect(properties.getProperty(stateKey)).toBeNull();
  });

  it('シリアライズ不可能な state を渡すと、元の processItem エラーが優先して伝播する', () => {
    const cyclic: Record<string, unknown> = { id: 1 };
    cyclic.self = cyclic;
    const originalError = new Error('processing failed');

    expect(() =>
      runWithContinuation('syncJob', [cyclic], () => {
        throw originalError;
      })
    ).toThrow(originalError);
  });

  it('継続トリガー作成前に同名の既存トリガーを掃除する（重複防止）', () => {
    // 事前に同名トリガーを 1 つ作っておく
    ScriptApp.newTrigger('continueSync').timeBased().after(60000).create();
    expect(ScriptApp.getProjectTriggers().filter((t) => t.getHandlerFunction() === 'continueSync')).toHaveLength(1);

    const nowSpy = jest.spyOn(Date, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(11);

    runWithContinuation('syncJob', [1, 2, 3], () => undefined, {
      maxExecMs: 10,
      triggerFunctionName: 'continueSync',
    });

    // 古いトリガーは削除され、新しいトリガーが 1 つだけ残る
    const remaining = ScriptApp.getProjectTriggers().filter((t) => t.getHandlerFunction() === 'continueSync');
    expect(remaining).toHaveLength(1);
    expect(ScriptApp.deleteTrigger).toHaveBeenCalled();
    nowSpy.mockRestore();
  });
});
