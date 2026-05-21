/**
 * Utils モジュールのユニットテスト
 */

import { log, formatDate, chunk, deepCopy, generateRandomString, sleep } from '../../../src/lib/utils';

describe('Utils Module', () => {
  describe('log', () => {
    it('info レベルのログを出力できる', () => {
      expect(() => {
        log('info', 'Test info message');
      }).not.toThrow();
    });

    it('warn レベルのログを出力できる', () => {
      expect(() => {
        log('warn', 'Test warning message');
      }).not.toThrow();
    });

    it('error レベルのログを出力できる', () => {
      expect(() => {
        log('error', 'Test error message');
      }).not.toThrow();
    });

    it('データ付きでログを出力できる', () => {
      expect(() => {
        log('info', 'Test message with data', { key: 'value' });
      }).not.toThrow();
    });
  });

  describe('formatDate', () => {
    it('日付を YYYY-MM-DD 形式でフォーマットする', () => {
      const date = new Date('2025-01-15T10:30:00');
      const result = formatDate(date);
      expect(result).toBe('2025-01-15');
    });

    it('月と日が1桁の場合、0埋めされる', () => {
      const date = new Date('2025-03-05T10:30:00');
      const result = formatDate(date);
      expect(result).toBe('2025-03-05');
    });

    it('timezone-sensitive dates use the local test timezone', () => {
      const date = new Date('2025-01-01T00:30:00+09:00');
      const result = formatDate(date);
      expect(result).toBe('2025-01-01');
    });

    it('年末年始の日付も正しくフォーマットする', () => {
      const date = new Date('2024-12-31T23:59:59');
      const result = formatDate(date);
      expect(result).toBe('2024-12-31');
    });
  });

  describe('sleep', () => {
    it('指定したミリ秒数だけ待機する（モック）', () => {
      expect(() => {
        sleep(1000);
      }).not.toThrow();

      // モックが呼ばれたことを確認
      expect(Utilities.sleep).toHaveBeenCalledWith(1000);
    });
  });

  describe('chunk', () => {
    it('配列を指定サイズのチャンクに分割する', () => {
      const array = [1, 2, 3, 4, 5, 6];
      const result = chunk(array, 2);
      expect(result).toEqual([[1, 2], [3, 4], [5, 6]]);
    });

    it('余りのある配列を正しく分割する', () => {
      const array = [1, 2, 3, 4, 5];
      const result = chunk(array, 2);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('空配列を渡すと空配列を返す', () => {
      const array: number[] = [];
      const result = chunk(array, 2);
      expect(result).toEqual([]);
    });

    it('size=1の場合、各要素が個別のチャンクになる', () => {
      const array = [1, 2, 3];
      const result = chunk(array, 1);
      expect(result).toEqual([[1], [2], [3]]);
    });

    it('チャンクサイズが配列長より大きい場合、全体が1つのチャンクになる', () => {
      const array = [1, 2, 3];
      const result = chunk(array, 5);
      expect(result).toEqual([[1, 2, 3]]);
    });
  });

  describe('deepCopy', () => {
    it('オブジェクトの深いコピーを作成する', () => {
      const original = { a: 1, b: { c: 2 } };
      const copied = deepCopy(original);

      expect(copied).toEqual(original);
      expect(copied).not.toBe(original);
      expect(copied.b).not.toBe(original.b);
    });

    it('配列の深いコピーを作成する', () => {
      const original = [1, [2, 3], { a: 4 }];
      const copied = deepCopy(original);

      expect(copied).toEqual(original);
      expect(copied).not.toBe(original);
    });

    it('nested array mutations do not affect the original object', () => {
      const original = { items: [{ value: 1 }] };
      const copied = deepCopy(original);

      copied.items[0].value = 99;

      expect(original.items[0].value).toBe(1);
      expect(copied.items[0].value).toBe(99);
    });

    it('コピー後の変更が元のオブジェクトに影響しない', () => {
      const original = { a: 1, b: { c: 2 } };
      const copied = deepCopy(original);

      copied.b.c = 999;

      expect(original.b.c).toBe(2);
      expect(copied.b.c).toBe(999);
    });
  });

  describe('generateRandomString', () => {
    it('指定した長さのランダム文字列を生成する', () => {
      const result = generateRandomString(10);
      expect(result).toHaveLength(10);
    });

    it('英数字のみを含む', () => {
      const result = generateRandomString(100);
      expect(result).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('毎回異なる文字列を生成する', () => {
      const result1 = generateRandomString(20);
      const result2 = generateRandomString(20);

      expect(result1).not.toBe(result2);
    });

    it('長さ0の場合、空文字列を返す', () => {
      const result = generateRandomString(0);
      expect(result).toBe('');
    });
  });

  describe('log (additional levels)', () => {
    it('debug レベルのログを出力できる', () => {
      expect(() => {
        log('debug', 'Test debug message');
      }).not.toThrow();
    });
  });

  describe('chunk (error case)', () => {
    it('size が 0 以下の場合、エラーをスローする', () => {
      expect(() => chunk([1, 2, 3], 0)).toThrow('Chunk size must be greater than 0');
      expect(() => chunk([1, 2, 3], -1)).toThrow('Chunk size must be greater than 0');
    });
  });
});
