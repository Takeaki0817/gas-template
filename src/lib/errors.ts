export type ErrorContext = Record<string, unknown>;

export interface SerializedAppError {
  name: string;
  message: string;
  code: string;
  context?: ErrorContext;
  cause?: SerializedAppError | { name: string; message: string; code: string; stack?: string };
  stack?: string;
}

/**
 * Application-level error with a stable machine-readable code and structured context.
 */
export class AppError extends Error {
  readonly code: string;
  readonly context?: ErrorContext;
  readonly cause?: Error;

  constructor(message: string, code: string, options?: { context?: ErrorContext; cause?: Error }) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.context = options?.context;
    this.cause = options?.cause;
  }

  /**
   * Convert this error and its cause chain into JSON-safe data for logging.
   */
  serialize(): SerializedAppError {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: toJsonSafe(this.context),
      cause: serializeCause(this.cause),
      stack: this.stack,
    };
  }
}

export class MissingSecretError extends AppError {
  constructor(key: string, cause?: Error) {
    super(`Missing required secret: ${key}`, 'MISSING_SECRET', { context: { key }, cause });
  }
}

export class DbConnectionError extends AppError {
  constructor(message: string, cause?: Error, context?: ErrorContext) {
    super(message, 'DB_CONNECTION_ERROR', { context, cause });
  }
}

export class SheetNotFoundError extends AppError {
  constructor(sheetName: string, cause?: Error) {
    super(`Sheet not found: ${sheetName}`, 'SHEET_NOT_FOUND', {
      context: { sheetName },
      cause,
    });
  }
}

export class RetriableError extends AppError {
  constructor(message: string, cause?: Error, context?: ErrorContext) {
    super(message, 'RETRIABLE_ERROR', { context, cause });
  }
}

const serializeCause = (cause: Error | undefined): SerializedAppError | undefined => {
  if (!cause) {
    return undefined;
  }

  if (cause instanceof AppError) {
    return cause.serialize();
  }

  return {
    name: cause.name,
    message: cause.message,
    code: 'UNKNOWN_ERROR',
    stack: cause.stack,
  };
};

const toJsonSafe = <T>(value: T): T | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(
    JSON.stringify(value, (_key, nestedValue: unknown) =>
      typeof nestedValue === 'bigint' ? nestedValue.toString() : nestedValue
    )
  ) as T;
};
