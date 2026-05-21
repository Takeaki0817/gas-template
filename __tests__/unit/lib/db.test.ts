import { executeQuery, withConnection, listTables, getColumns } from '../../../src/lib/db';
import { DbConnectionError } from '../../../src/lib/errors';

describe('db utilities', () => {
  const config = { url: 'jdbc:google:mysql://project:region:instance/db', user: 'user', password: 'pw' };

  it('withConnection closes connection on success', () => {
    const conn = (Jdbc as any).__createConnection();
    (Jdbc.getCloudSqlConnection as jest.Mock).mockReturnValue(conn);

    const result = withConnection(config, () => 'ok');

    expect(result).toBe('ok');
    expect(conn.close).toHaveBeenCalledTimes(1);
  });

  it('withConnection closes connection and wraps thrown operation errors', () => {
    const conn = (Jdbc as any).__createConnection();
    (Jdbc.getCloudSqlConnection as jest.Mock).mockReturnValue(conn);

    expect(() => withConnection(config, () => {
      throw new Error('query failed');
    })).toThrow(DbConnectionError);
    expect(conn.close).toHaveBeenCalledTimes(1);
  });

  it('executeQuery binds params to prepared statements', () => {
    const conn = (Jdbc as any).__createConnection([{ id: '1', name: 'alpha' }]);
    const rows = executeQuery(conn, 'SELECT * FROM users WHERE id = ? AND status = ?', [1, 'active']);
    const statement = conn.prepareStatement.mock.results[0].value;

    expect(statement.setObject).toHaveBeenCalledWith(1, 1);
    expect(statement.setObject).toHaveBeenCalledWith(2, 'active');
    expect(rows).toEqual([{ id: '1', name: 'alpha' }]);
  });

  it('executeQuery without params uses plain statement', () => {
    const conn = (Jdbc as any).__createConnection([{ TABLE_NAME: 'users' }]);
    const rows = executeQuery(conn, 'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES');

    expect(conn.createStatement).toHaveBeenCalled();
    expect(conn.prepareStatement).not.toHaveBeenCalled();
    expect(rows).toEqual([{ TABLE_NAME: 'users' }]);
  });

  it('wraps connection errors as DbConnectionError', () => {
    const cause = new Error('cannot connect');
    (Jdbc.getCloudSqlConnection as jest.Mock).mockImplementation(() => {
      throw cause;
    });

    try {
      withConnection(config, () => undefined);
      throw new Error('expected error');
    } catch (error) {
      expect(error).toBeInstanceOf(DbConnectionError);
      expect((error as DbConnectionError).cause).toBe(cause);
    }
  });

  it('listTables returns rows via executeQuery', () => {
    const conn = (Jdbc as any).__createConnection([{ TABLE_NAME: 'orders' }]);
    const rows = listTables(conn, 'mydb');

    expect(rows).toEqual([{ TABLE_NAME: 'orders' }]);
  });

  it('getColumns returns column metadata via executeQuery', () => {
    const conn = (Jdbc as any).__createConnection([
      { COLUMN_NAME: 'id', DATA_TYPE: 'int', IS_NULLABLE: 'NO', COLUMN_DEFAULT: null },
    ]);
    const rows = getColumns(conn, 'mydb', 'users');

    expect(rows[0]).toMatchObject({ COLUMN_NAME: 'id' });
  });

  describe('close エラーのマスキング防止', () => {
    it('conn.close が例外を投げても fn の戻り値が返る', () => {
      const conn = (Jdbc as any).__createConnection();
      (conn.close as jest.Mock).mockImplementation(() => {
        throw new Error('close failed');
      });
      (Jdbc.getCloudSqlConnection as jest.Mock).mockReturnValue(conn);

      const result = withConnection(config, () => 'ok');

      expect(result).toBe('ok');
    });

    it('conn.close が例外を投げても、fn の中で起きた例外が優先して伝播する', () => {
      const conn = (Jdbc as any).__createConnection();
      (conn.close as jest.Mock).mockImplementation(() => {
        throw new Error('close failed');
      });
      (Jdbc.getCloudSqlConnection as jest.Mock).mockReturnValue(conn);

      try {
        withConnection(config, () => {
          throw new Error('original query failure');
        });
        throw new Error('expected error');
      } catch (error) {
        expect(error).toBeInstanceOf(DbConnectionError);
        expect((error as DbConnectionError).cause?.message).toBe('original query failure');
      }
    });

    it('resultSet.close / statement.close が失敗しても executeQuery は結果を返す', () => {
      const conn = (Jdbc as any).__createConnection([{ id: '1' }]);
      const rows = executeQuery(conn, 'SELECT * FROM users');

      // 実 close 実装を例外に差し替えて再実行
      const conn2 = (Jdbc as any).__createConnection([{ id: '2' }]);
      const stmt = conn2.createStatement();
      (stmt.close as jest.Mock).mockImplementation(() => {
        throw new Error('stmt close failed');
      });
      (conn2.createStatement as jest.Mock).mockReturnValue(stmt);

      expect(() => executeQuery(conn2, 'SELECT * FROM users')).not.toThrow();
      expect(rows).toEqual([{ id: '1' }]);
    });
  });
});
