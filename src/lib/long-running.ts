interface ContinuationOptions {
  maxExecMs?: number;
  triggerFunctionName?: string;
  continueAfterMs?: number;
}

interface ContinuationState<T> {
  items: T[];
  nextIndex: number;
}

const DEFAULT_MAX_EXEC_MS = 5 * 60 * 1000;
const DEFAULT_CONTINUE_AFTER_MS = 60 * 1000;

/**
 * バッチ処理を実行時間予算が尽きそうになるまで進め、未完了なら継続トリガーで再開する。
 *
 * 残アイテムと nextIndex を PropertiesService に保存し、time-driven トリガーで
 * triggerFunctionName を後続の Apps Script 実行から呼び出して再開する設計。
 */
export function runWithContinuation<T>(
  jobName: string,
  items: T[],
  processItem: (item: T) => void,
  options: ContinuationOptions = {}
): void {
  const maxExecMs = options.maxExecMs ?? DEFAULT_MAX_EXEC_MS;
  const triggerFunctionName = options.triggerFunctionName ?? jobName;
  const continueAfterMs = options.continueAfterMs ?? DEFAULT_CONTINUE_AFTER_MS;
  const stateKey = getStateKey(jobName);
  const startedAt = Date.now();
  const properties = PropertiesService.getScriptProperties();
  const savedState = readState<T>(properties, stateKey);
  const state: ContinuationState<T> = savedState ?? { items, nextIndex: 0 };
  let index = state.nextIndex;

  try {
    for (; index < state.items.length; index++) {
      if (Date.now() - startedAt >= maxExecMs) {
        saveState(properties, stateKey, { items: state.items, nextIndex: index });
        scheduleContinuation(triggerFunctionName, continueAfterMs);
        return;
      }

      processItem(state.items[index]);
    }

    properties.deleteProperty(stateKey);
    deleteContinuationTriggers(triggerFunctionName);
  } catch (originalError) {
    // 元エラーを優先して伝播させる。state 保存とトリガー登録の失敗は別ログに切り出すだけ。
    try {
      saveState(properties, stateKey, { items: state.items, nextIndex: index });
      scheduleContinuation(triggerFunctionName, continueAfterMs);
    } catch (saveError) {
      try {
        globalThis.Logger?.log?.(
          `runWithContinuation: failed to persist continuation state for '${jobName}': ${String(saveError)}`
        );
      } catch (_logError) {
        // ロガー自体が使えない環境では諦める
      }
    }
    throw originalError;
  }
}

const getStateKey = (jobName: string): string => `CONTINUATION_STATE_${jobName}`;

const readState = <T>(
  properties: GoogleAppsScript.Properties.Properties,
  stateKey: string
): ContinuationState<T> | null => {
  const serialized = properties.getProperty(stateKey);
  if (!serialized) {
    return null;
  }
  try {
    return JSON.parse(serialized) as ContinuationState<T>;
  } catch (_error) {
    // 破損した state は捨ててリセットする
    properties.deleteProperty(stateKey);
    return null;
  }
};

const saveState = <T>(
  properties: GoogleAppsScript.Properties.Properties,
  stateKey: string,
  state: ContinuationState<T>
): void => {
  let serialized: string;
  try {
    serialized = JSON.stringify(state);
  } catch (error) {
    throw new Error(
      `runWithContinuation: continuation state is not JSON-serializable (jobName="${stateKey}"): ${String(error)}`
    );
  }
  properties.setProperty(stateKey, serialized);
};

const scheduleContinuation = (triggerFunctionName: string, continueAfterMs: number): void => {
  // 連続中断時に同名トリガーが累積しないよう、既存トリガーをクリーンアップしてから新規作成する。
  // 1 回だけ実行されるワンショットトリガー。完了時にも deleteContinuationTriggers で掃除する。
  deleteContinuationTriggers(triggerFunctionName);
  ScriptApp.newTrigger(triggerFunctionName).timeBased().after(continueAfterMs).create();
};

const deleteContinuationTriggers = (triggerFunctionName: string): void => {
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === triggerFunctionName)
    .forEach((trigger) => {
      ScriptApp.deleteTrigger(trigger);
    });
};
