import {
  AppError,
  DbConnectionError,
  MissingSecretError,
  RetriableError,
  SheetNotFoundError,
} from '../../../src/lib/errors';

describe('AppError hierarchy', () => {
  it('preserves code, context, and cause', () => {
    const cause = new Error('root cause');
    const error = new AppError('failed', 'APP_FAILED', {
      context: { id: 123 },
      cause,
    });

    expect(error.code).toBe('APP_FAILED');
    expect(error.context).toEqual({ id: 123 });
    expect(error.cause).toBe(cause);
  });

  it('serialize returns JSON-safe data', () => {
    const error = new AppError('failed', 'APP_FAILED', {
      context: { count: BigInt(10), nested: { ok: true } },
    });

    expect(JSON.parse(JSON.stringify(error.serialize()))).toMatchObject({
      name: 'AppError',
      message: 'failed',
      code: 'APP_FAILED',
      context: { count: '10', nested: { ok: true } },
    });
  });

  it('MissingSecretError uses stable code', () => {
    expect(new MissingSecretError('TOKEN').code).toBe('MISSING_SECRET');
  });

  it('DbConnectionError uses stable code', () => {
    expect(new DbConnectionError('db failed').code).toBe('DB_CONNECTION_ERROR');
  });

  it('SheetNotFoundError uses stable code', () => {
    const error = new SheetNotFoundError('MySheet');
    expect(error.code).toBe('SHEET_NOT_FOUND');
    expect(error.message).toBe('Sheet not found: MySheet');
    expect(error.context).toEqual({ sheetName: 'MySheet' });
  });

  it('serializes AppError cause chains', () => {
    const cause = new MissingSecretError('DB_PASSWORD');
    const error = new RetriableError('retry later', cause, { attempt: 2 });

    expect(error.serialize()).toMatchObject({
      code: 'RETRIABLE_ERROR',
      cause: {
        code: 'MISSING_SECRET',
        context: { key: 'DB_PASSWORD' },
      },
    });
  });

  it('serializes plain Error as cause with UNKNOWN_ERROR code', () => {
    const cause = new Error('plain error');
    const error = new AppError('wrapper', 'WRAPPER_ERROR', { cause });

    const serialized = error.serialize();
    expect(serialized.cause).toMatchObject({
      name: 'Error',
      message: 'plain error',
      code: 'UNKNOWN_ERROR',
    });
  });

  it('serialize without cause returns undefined cause', () => {
    const error = new AppError('no cause', 'NO_CAUSE');
    expect(error.serialize().cause).toBeUndefined();
  });
});
