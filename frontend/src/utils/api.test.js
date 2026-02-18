import { apiUrl, getApiBaseUrl } from './api';

describe('api utils', () => {
  const originalApiBase = process.env.REACT_APP_API_BASE_URL;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalApiBase === undefined) {
      delete process.env.REACT_APP_API_BASE_URL;
    } else {
      process.env.REACT_APP_API_BASE_URL = originalApiBase;
    }

    process.env.NODE_ENV = originalNodeEnv;
  });

  test('uses REACT_APP_API_BASE_URL when set', () => {
    process.env.REACT_APP_API_BASE_URL = 'https://example.com/';
    expect(getApiBaseUrl()).toBe('https://example.com');
    expect(apiUrl('/api/items')).toBe('https://example.com/api/items');
    expect(apiUrl('api/items')).toBe('https://example.com/api/items');
  });

  test('defaults to localhost backend in development', () => {
    delete process.env.REACT_APP_API_BASE_URL;
    process.env.NODE_ENV = 'development';
    expect(getApiBaseUrl()).toBe('http://localhost:3001');
    expect(apiUrl('/api/items')).toBe('http://localhost:3001/api/items');
  });

  test('uses relative URLs outside development when no base is set', () => {
    delete process.env.REACT_APP_API_BASE_URL;
    process.env.NODE_ENV = 'test';
    expect(getApiBaseUrl()).toBe('');
    expect(apiUrl('/api/items')).toBe('/api/items');
  });
});

