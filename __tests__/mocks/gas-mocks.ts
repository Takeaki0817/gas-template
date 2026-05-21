/**
 * Google Apps Script API のモック実装
 * ローカルテスト環境でGAS APIをシミュレート
 */

type PropertyStore = ReturnType<typeof createPropertiesStore>;

type MockRow = Record<string, unknown>;

const loggerHistory: unknown[] = [];

// ==============================
// Logger モック
// ==============================
export const Logger = {
  log: jest.fn((message: unknown) => {
    loggerHistory.push(message);
    if (process.env.DEBUG_LOGS === 'true') {
      console.log(`[Logger] ${message}`);
    }
  }),
  clear: jest.fn(() => {
    loggerHistory.length = 0;
    Logger.log.mockClear();
  }),
  getHistory: jest.fn(() => [...loggerHistory]),
};

// ==============================
// Utilities モック
// ==============================
export const Utilities = {
  sleep: jest.fn((_milliseconds: number) => undefined),
  formatDate: jest.fn((date: Date, _timeZone: string, _format: string) => date.toISOString()),
  formatString: jest.fn((template: string, ...args: unknown[]) => {
    return template.replace(/%s/g, () => String(args.shift() || ''));
  }),
  base64Encode: jest.fn((data: string) => Buffer.from(data).toString('base64')),
  base64Decode: jest.fn((encoded: string) => Buffer.from(encoded, 'base64').toString()),
  getUuid: jest.fn(() => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  })),
};

// ==============================
// PropertiesService モック
// ==============================
const createPropertiesStore = () => {
  const store = new Map<string, string>();

  return {
    getProperty: jest.fn((key: string) => store.get(key) ?? null),
    setProperty: jest.fn((key: string, value: string) => {
      store.set(key, String(value));
      return undefined;
    }),
    setProperties: jest.fn((properties: Record<string, string>, deleteAllOthers?: boolean) => {
      if (deleteAllOthers) {
        store.clear();
      }
      Object.entries(properties).forEach(([key, value]) => store.set(key, String(value)));
      return undefined;
    }),
    getProperties: jest.fn(() => Object.fromEntries(store.entries())),
    deleteProperty: jest.fn((key: string) => {
      store.delete(key);
      return undefined;
    }),
    deleteAllProperties: jest.fn(() => {
      store.clear();
      return undefined;
    }),
    getKeys: jest.fn(() => Array.from(store.keys())),
    __store: store,
  };
};

const scriptProperties = createPropertiesStore();
const userProperties = createPropertiesStore();
const documentProperties = createPropertiesStore();

export const PropertiesService = {
  getScriptProperties: jest.fn(() => scriptProperties),
  getUserProperties: jest.fn(() => userProperties),
  getDocumentProperties: jest.fn(() => documentProperties),
  __stores: {
    scriptProperties,
    userProperties,
    documentProperties,
  },
};

// ==============================
// JDBC モック
// ==============================
const defaultRows: MockRow[] = [
  { id: '1', name: 'alpha', amount: '10.5' },
  { id: '2', name: 'beta', amount: '20.5' },
];

const createResultSet = (rows: MockRow[] = defaultRows) => {
  let index = -1;
  const columnNames = Object.keys(rows[0] ?? {});

  return {
    next: jest.fn(() => {
      index += 1;
      return index < rows.length;
    }),
    getString: jest.fn((col: number | string) => String(getCell(rows[index], columnNames, col) ?? '')),
    getInt: jest.fn((col: number | string) => Number.parseInt(String(getCell(rows[index], columnNames, col) ?? 0), 10)),
    getDouble: jest.fn((col: number | string) => Number.parseFloat(String(getCell(rows[index], columnNames, col) ?? 0))),
    getMetaData: jest.fn(() => ({
      getColumnCount: jest.fn(() => columnNames.length),
      getColumnName: jest.fn((col: number) => columnNames[col - 1]),
      getColumnLabel: jest.fn((col: number) => columnNames[col - 1]),
    })),
    close: jest.fn(),
    __rows: rows,
  };
};

const createStatement = (rows?: MockRow[]) => ({
  execute: jest.fn((_sql?: string) => true),
  executeQuery: jest.fn((_sql?: string) => createResultSet(rows)),
  close: jest.fn(),
});

const createPreparedStatement = (sql: string, rows?: MockRow[]) => ({
  execute: jest.fn(() => true),
  executeQuery: jest.fn(() => createResultSet(rows)),
  close: jest.fn(),
  setObject: jest.fn(),
  setString: jest.fn(),
  setInt: jest.fn(),
  setDouble: jest.fn(),
  __sql: sql,
});

const createJdbcConnection = (rows?: MockRow[]) => {
  let closed = false;
  const conn = {
    createStatement: jest.fn(() => createStatement(rows)),
    prepareStatement: jest.fn((sql: string) => createPreparedStatement(sql, rows)),
    close: jest.fn(() => {
      closed = true;
    }),
    isClosed: jest.fn(() => closed),
    __rows: rows ?? defaultRows,
  };
  return conn;
};

export const Jdbc = {
  getCloudSqlConnection: jest.fn((_url: string, _user: string, _password: string) => createJdbcConnection()),
  __createConnection: createJdbcConnection,
  __createResultSet: createResultSet,
};

function getCell(row: MockRow | undefined, columnNames: string[], col: number | string): unknown {
  if (!row) {
    return undefined;
  }
  const columnName = typeof col === 'number' ? columnNames[col - 1] : col;
  return row[columnName];
}

// ==============================
// SpreadsheetApp モック
// ==============================
const createRangeMock = () => ({
  setValue: jest.fn(),
  setValues: jest.fn(),
  getValue: jest.fn(() => ''),
  getValues: jest.fn(() => [[]]),
  getFormulas: jest.fn(() => [[]]),
  setFormula: jest.fn(),
  setFormulas: jest.fn(),
  getNumRows: jest.fn(() => 1),
  getNumColumns: jest.fn(() => 1),
  getRow: jest.fn(() => 1),
  getColumn: jest.fn(() => 1),
  clear: jest.fn(),
  clearContent: jest.fn(),
});

const createSheetMock = (name = 'Sheet1') => {
  const rows: unknown[][] = [];
  return {
    getRange: jest.fn((_notation: string | number, _column?: number, _numRows?: number, _numColumns?: number) => createRangeMock()),
    getLastRow: jest.fn(() => rows.length),
    getLastColumn: jest.fn(() => (rows[0] ? rows[0].length : 0)),
    getName: jest.fn(() => name),
    getSheetId: jest.fn(() => 0),
    appendRow: jest.fn((row: unknown[]) => {
      rows.push(row);
      return undefined;
    }),
    insertRowBefore: jest.fn(),
    insertRowAfter: jest.fn(),
    deleteRow: jest.fn(),
    getDataRange: jest.fn(() => createRangeMock()),
    clear: jest.fn(() => {
      rows.length = 0;
    }),
    __rows: rows,
  };
};

const createSpreadsheetMock = () => {
  const sheets = new Map<string, ReturnType<typeof createSheetMock>>();
  const sheet1 = createSheetMock('Sheet1');
  sheets.set('Sheet1', sheet1);

  return {
    getActiveSheet: jest.fn(() => sheet1),
    getSheetByName: jest.fn((name: string) => sheets.get(name) ?? null),
    insertSheet: jest.fn((name: string) => {
      const sheet = createSheetMock(name);
      sheets.set(name, sheet);
      return sheet;
    }),
    getSheets: jest.fn(() => Array.from(sheets.values())),
    getName: jest.fn(() => 'Test Spreadsheet'),
    getId: jest.fn(() => 'test-spreadsheet-id'),
    getUrl: jest.fn(() => 'https://docs.google.com/spreadsheets/d/test-id/edit'),
    __sheets: sheets,
  };
};

const activeSpreadsheet = createSpreadsheetMock();

export const SpreadsheetApp = {
  getActiveSpreadsheet: jest.fn(() => activeSpreadsheet),
  openById: jest.fn((_id: string) => createSpreadsheetMock()),
  openByUrl: jest.fn((_url: string) => createSpreadsheetMock()),
  create: jest.fn((_name: string) => createSpreadsheetMock()),
  getUi: jest.fn(() => ({
    alert: jest.fn((_message: string) => undefined),
    createMenu: jest.fn((_caption: string) => ({
      addItem: jest.fn(function (this: unknown) {
        return this;
      }),
      addSeparator: jest.fn(function (this: unknown) {
        return this;
      }),
      addSubMenu: jest.fn(function (this: unknown) {
        return this;
      }),
      addToUi: jest.fn(),
    })),
    ButtonSet: {
      OK: 'OK',
      OK_CANCEL: 'OK_CANCEL',
      YES_NO: 'YES_NO',
      YES_NO_CANCEL: 'YES_NO_CANCEL',
    },
    Button: {
      OK: 'OK',
      CANCEL: 'CANCEL',
      YES: 'YES',
      NO: 'NO',
      CLOSE: 'CLOSE',
    },
  })),
  __activeSpreadsheet: activeSpreadsheet,
};

// ==============================
// ScriptApp モック
// ==============================
type TriggerMock = {
  getHandlerFunction: jest.Mock<string, []>;
  getUniqueId: jest.Mock<string, []>;
  __after?: number;
  __everyMinutes?: number;
};

const triggers: TriggerMock[] = [];
let triggerCounter = 0;

export const ScriptApp = {
  newTrigger: jest.fn((fnName: string) => ({
    timeBased: jest.fn(function (this: Record<string, unknown>) {
      return this;
    }),
    after: jest.fn(function (this: Record<string, unknown>, milliseconds: number) {
      this.__after = milliseconds;
      return this;
    }),
    everyMinutes: jest.fn(function (this: Record<string, unknown>, minutes: number) {
      this.__everyMinutes = minutes;
      return this;
    }),
    create: jest.fn(function (this: { __after?: number; __everyMinutes?: number }) {
      triggerCounter += 1;
      const trigger = {
        getHandlerFunction: jest.fn(() => fnName),
        getUniqueId: jest.fn(() => String(triggerCounter)),
        __after: this.__after,
        __everyMinutes: this.__everyMinutes,
      };
      triggers.push(trigger);
      return trigger;
    }),
  })),
  getProjectTriggers: jest.fn(() => [...triggers]),
  deleteTrigger: jest.fn((trigger: TriggerMock) => {
    const index = triggers.indexOf(trigger);
    if (index >= 0) {
      triggers.splice(index, 1);
    }
  }),
  __triggers: triggers,
};

// ==============================
// UrlFetchApp モック
// ==============================
export const UrlFetchApp = {
  fetch: jest.fn((_url: string, _params?: unknown) => ({
    getContentText: jest.fn(() => '{"status": "ok"}'),
    getResponseCode: jest.fn(() => 200),
    getHeaders: jest.fn(() => ({})),
    getBlob: jest.fn(),
  })),
};

// ==============================
// Session モック
// ==============================
export const Session = {
  getActiveUser: jest.fn(() => ({
    getEmail: jest.fn(() => 'test@example.com'),
  })),
  getEffectiveUser: jest.fn(() => ({
    getEmail: jest.fn(() => 'test@example.com'),
  })),
  getScriptTimeZone: jest.fn(() => 'Asia/Tokyo'),
  getTemporaryActiveUserKey: jest.fn(() => 'test-user-key'),
};

// ==============================
// HtmlService モック
// ==============================
export const HtmlService = {
  createHtmlOutput: jest.fn((html: string) => ({
    setTitle: jest.fn(function (this: unknown) {
      return this;
    }),
    setWidth: jest.fn(function (this: unknown) {
      return this;
    }),
    setHeight: jest.fn(function (this: unknown) {
      return this;
    }),
    getContent: jest.fn(() => html),
  })),
  createHtmlOutputFromFile: jest.fn((_filename: string) => ({
    setTitle: jest.fn(function (this: unknown) {
      return this;
    }),
    getContent: jest.fn(() => '<html></html>'),
  })),
};

// ==============================
// ContentService モック
// ==============================
export const ContentService = {
  createTextOutput: jest.fn((content: string) => ({
    setMimeType: jest.fn(function (this: unknown) {
      return this;
    }),
    setContent: jest.fn(function (this: unknown) {
      return this;
    }),
    getContent: jest.fn(() => content),
  })),
  MimeType: {
    TEXT: 'text/plain',
    JSON: 'application/json',
    JAVASCRIPT: 'application/javascript',
    XML: 'application/xml',
    HTML: 'text/html',
  },
};

export function resetGasMocks(): void {
  [scriptProperties, userProperties, documentProperties].forEach((store: PropertyStore) => {
    store.deleteAllProperties();
    Object.values(store).forEach((value) => {
      if (jest.isMockFunction(value)) {
        value.mockClear();
      }
    });
  });

  triggers.length = 0;
  triggerCounter = 0;
  Logger.clear();
  jest.clearAllMocks();
  PropertiesService.getScriptProperties.mockImplementation(() => scriptProperties);
  PropertiesService.getUserProperties.mockImplementation(() => userProperties);
  PropertiesService.getDocumentProperties.mockImplementation(() => documentProperties);
  SpreadsheetApp.getActiveSpreadsheet.mockImplementation(() => activeSpreadsheet);
  Jdbc.getCloudSqlConnection.mockImplementation((_url: string, _user: string, _password: string) =>
    createJdbcConnection()
  );
  ScriptApp.getProjectTriggers.mockImplementation(() => [...triggers]);
}


// ==============================
// グローバルオブジェクトにモックを登録
// ==============================
(global as any).Logger = Logger;
(global as any).Utilities = Utilities;
(global as any).PropertiesService = PropertiesService;
(global as any).Jdbc = Jdbc;
(global as any).SpreadsheetApp = SpreadsheetApp;
(global as any).ScriptApp = ScriptApp;
(global as any).UrlFetchApp = UrlFetchApp;
(global as any).Session = Session;
(global as any).HtmlService = HtmlService;
(global as any).ContentService = ContentService;
