import { DbConnectionError } from './errors';

export interface DbConfig {
  url: string;
  user: string;
  password: string;
}

export function withConnection<T>(
  config: DbConfig,
  fn: (conn: GoogleAppsScript.JDBC.JdbcConnection) => T
): T {
  let conn: GoogleAppsScript.JDBC.JdbcConnection | undefined;

  try {
    conn = Jdbc.getCloudSqlConnection(config.url, config.user, config.password);
    return fn(conn);
  } catch (error) {
    throw new DbConnectionError('Database operation failed', asError(error), { url: config.url });
  } finally {
    // close 失敗で本来のエラー（fn の中で起きた失敗）がマスクされないよう握りつぶす
    safeClose(conn);
  }
}

export function executeQuery(
  conn: GoogleAppsScript.JDBC.JdbcConnection,
  sql: string,
  params: unknown[] = []
): Record<string, unknown>[] {
  const statement = params.length > 0 ? conn.prepareStatement(sql) : conn.createStatement();
  let resultSet: GoogleAppsScript.JDBC.JdbcResultSet | undefined;

  try {
    params.forEach((param, index) => {
      (statement as GoogleAppsScript.JDBC.JdbcPreparedStatement).setObject(index + 1, param);
    });

    resultSet =
      params.length > 0
        ? (statement as GoogleAppsScript.JDBC.JdbcPreparedStatement).executeQuery()
        : (statement as GoogleAppsScript.JDBC.JdbcStatement).executeQuery(sql);

    return resultSetToRows(resultSet);
  } finally {
    // ResultSet → Statement の順でクローズ。close 失敗は元の例外をマスクしないよう握りつぶす
    safeClose(resultSet);
    safeClose(statement);
  }
}

export function listTables(
  conn: GoogleAppsScript.JDBC.JdbcConnection,
  dbName: string
): Record<string, unknown>[] {
  return executeQuery(
    conn,
    'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME',
    [dbName]
  );
}

export function getColumns(
  conn: GoogleAppsScript.JDBC.JdbcConnection,
  dbName: string,
  tableName: string
): Record<string, unknown>[] {
  return executeQuery(
    conn,
    `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
     ORDER BY ORDINAL_POSITION`,
    [dbName, tableName]
  );
}

function resultSetToRows(resultSet: GoogleAppsScript.JDBC.JdbcResultSet): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  const metaData = resultSet.getMetaData();
  const columnCount = metaData.getColumnCount();

  while (resultSet.next()) {
    const row: Record<string, unknown> = {};
    for (let index = 1; index <= columnCount; index++) {
      const columnName = metaData.getColumnName(index);
      row[columnName] = resultSet.getString(index);
    }
    rows.push(row);
  }

  return rows;
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

interface Closeable {
  close: () => void;
}

function safeClose(closeable: Closeable | undefined): void {
  if (!closeable) {
    return;
  }
  try {
    closeable.close();
  } catch (_error) {
    // best-effort: close 失敗は無視
  }
}
