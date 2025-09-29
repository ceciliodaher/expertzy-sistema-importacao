/**
 * Test Setup - Vitest Global Configuration
 * Sistema Expertzy - Importação e Precificação
 */

import { vi } from 'vitest';

// Mock IndexedDB para testes unitários
const mockIndexedDB = {
  open: vi.fn(() => ({
    onsuccess: null,
    onerror: null,
    result: {
      createObjectStore: vi.fn(),
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          add: vi.fn(),
          get: vi.fn(),
          put: vi.fn(),
          delete: vi.fn(),
          getAll: vi.fn()
        }))
      }))
    }
  })),
  deleteDatabase: vi.fn()
};

// Mock APIs do browser para testes
global.indexedDB = mockIndexedDB;
global.IDBKeyRange = {
  bound: vi.fn(),
  only: vi.fn(),
  lowerBound: vi.fn(),
  upperBound: vi.fn()
};

// Mock URL e Blob para testes de export
global.URL = {
  createObjectURL: vi.fn(() => 'mock-url'),
  revokeObjectURL: vi.fn()
};

global.Blob = vi.fn((content, options) => ({
  size: content[0].length,
  type: options?.type || 'application/octet-stream'
}));

// Mock FileReader para testes de upload
global.FileReader = vi.fn(() => ({
  readAsText: vi.fn(),
  onload: null,
  onerror: null,
  result: null
}));

// Mock DOMParser para testes de XML
global.DOMParser = vi.fn(() => ({
  parseFromString: vi.fn((str, type) => {
    // Simulação básica de parsing XML
    return {
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      getElementsByTagName: vi.fn(() => [])
    };
  })
}));

// Mock console para capturar logs em testes
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn()
};

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
global.localStorage = localStorageMock;

// Setup para cada teste
beforeEach(() => {
  // Reset de todos os mocks
  vi.clearAllMocks();
  
  // Reset localStorage mock
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});