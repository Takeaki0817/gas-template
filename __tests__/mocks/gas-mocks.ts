/**
 * Google Apps Script API のモック実装
 * ローカルテスト環境でGAS APIをシミュレート
 */

// ==============================
// Logger モック
// ==============================
export const Logger = {
  log: jest.fn((message: unknown) => {
    if (process.env.DEBUG_LOGS === 'true') {
      console.log(`[Logger] ${message}`);
    }
  }),
  clear: jest.fn(),
};

// ==============================
// Utilities モック
// ==============================
export const Utilities = {
  sleep: jest.fn((milliseconds: number) => {
    // テスト環境では実際に待機しない
  }),
  formatDate: jest.fn((date: Date, timeZone: string, format: string) => {
    return date.toISOString();
  }),
  formatString: jest.fn((template: string, ...args: unknown[]) => {
    return template.replace(/%s/g, () => String(args.shift() || ''));
  }),
  base64Encode: jest.fn((data: string) => {
    return Buffer.from(data).toString('base64');
  }),
  base64Decode: jest.fn((encoded: string) => {
    return Buffer.from(encoded, 'base64').toString();
  }),
  getUuid: jest.fn(() => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }),
};

// ==============================
// PropertiesService モック
// ==============================
const createPropertiesStore = () => {
  const store = new Map<string, string>();

  return {
    getProperty: jest.fn((key: string) => store.get(key) || null),
    setProperty: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return undefined;
    }),
    getProperties: jest.fn(() => {
      const obj: { [key: string]: string } = {};
      store.forEach((value, key) => {
        obj[key] = value;
      });
      return obj;
    }),
    deleteProperty: jest.fn((key: string) => {
      store.delete(key);
      return undefined;
    }),
    deleteAllProperties: jest.fn(() => {
      store.clear();
      return undefined;
    }),
    getKeys: jest.fn(() => Array.from(store.keys())),
  };
};

export const PropertiesService = {
  getScriptProperties: jest.fn(() => createPropertiesStore()),
  getUserProperties: jest.fn(() => createPropertiesStore()),
  getDocumentProperties: jest.fn(() => createPropertiesStore()),
};

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

const createSheetMock = () => ({
  getRange: jest.fn((notation: string | number, column?: number, numRows?: number, numColumns?: number) => {
    return createRangeMock();
  }),
  getLastRow: jest.fn(() => 10),
  getLastColumn: jest.fn(() => 5),
  getName: jest.fn(() => 'Sheet1'),
  getSheetId: jest.fn(() => 0),
  appendRow: jest.fn(),
  insertRowBefore: jest.fn(),
  insertRowAfter: jest.fn(),
  deleteRow: jest.fn(),
  getDataRange: jest.fn(() => createRangeMock()),
  clear: jest.fn(),
});

const createSpreadsheetMock = () => ({
  getActiveSheet: jest.fn(() => createSheetMock()),
  getSheetByName: jest.fn((name: string) => createSheetMock()),
  getSheets: jest.fn(() => [createSheetMock()]),
  getName: jest.fn(() => 'Test Spreadsheet'),
  getId: jest.fn(() => 'test-spreadsheet-id'),
  getUrl: jest.fn(() => 'https://docs.google.com/spreadsheets/d/test-id/edit'),
});

export const SpreadsheetApp = {
  getActiveSpreadsheet: jest.fn(() => createSpreadsheetMock()),
  openById: jest.fn((id: string) => createSpreadsheetMock()),
  openByUrl: jest.fn((url: string) => createSpreadsheetMock()),
  create: jest.fn((name: string) => createSpreadsheetMock()),
  getUi: jest.fn(() => ({
    alert: jest.fn((message: string) => {}),
    createMenu: jest.fn((caption: string) => ({
      addItem: jest.fn(function (this: any, caption: string, functionName: string) {
        return this;
      }),
      addSeparator: jest.fn(function (this: any) {
        return this;
      }),
      addSubMenu: jest.fn(function (this: any, menu: unknown) {
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
};

// ==============================
// UrlFetchApp モック
// ==============================
export const UrlFetchApp = {
  fetch: jest.fn((url: string, params?: unknown) => ({
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
    setTitle: jest.fn(function (this: any, title: string) {
      return this;
    }),
    setWidth: jest.fn(function (this: any, width: number) {
      return this;
    }),
    setHeight: jest.fn(function (this: any, height: number) {
      return this;
    }),
    getContent: jest.fn(() => html),
  })),
  createHtmlOutputFromFile: jest.fn((filename: string) => ({
    setTitle: jest.fn(function (this: any, title: string) {
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
    setMimeType: jest.fn(function (this: any, mimeType: string) {
      return this;
    }),
    setContent: jest.fn(function (this: any, content: string) {
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

// ==============================
// グローバルオブジェクトにモックを登録
// ==============================
(global as any).Logger = Logger;
(global as any).Utilities = Utilities;
(global as any).PropertiesService = PropertiesService;
(global as any).SpreadsheetApp = SpreadsheetApp;
(global as any).UrlFetchApp = UrlFetchApp;
(global as any).Session = Session;
(global as any).HtmlService = HtmlService;
(global as any).ContentService = ContentService;
