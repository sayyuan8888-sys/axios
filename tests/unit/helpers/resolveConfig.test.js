import { describe, it, expect } from 'vitest';
import resolveConfig from '../../../lib/helpers/resolveConfig.js';
import AxiosHeaders from '../../../lib/core/AxiosHeaders.js';

describe('helpers::resolveConfig', () => {
  it('should return a new config object', () => {
    const config = { url: '/test', headers: {} };
    const resolved = resolveConfig(config);
    expect(resolved).not.toBe(config);
  });

  it('should wrap headers in AxiosHeaders', () => {
    const config = { url: '/test', headers: { 'X-Test': '1' } };
    const resolved = resolveConfig(config);
    expect(resolved.headers).toBeInstanceOf(AxiosHeaders);
  });

  it('should build the full URL from baseURL and url', () => {
    const config = { baseURL: 'https://api.example.com', url: '/users', headers: {} };
    const resolved = resolveConfig(config);
    expect(resolved.url).toBe('https://api.example.com/users');
  });

  it('should append params to the URL', () => {
    const config = { url: 'https://api.example.com/users', params: { id: 1 }, headers: {} };
    const resolved = resolveConfig(config);
    expect(resolved.url).toBe('https://api.example.com/users?id=1');
  });

  it('should set Authorization header from auth config', () => {
    const config = {
      url: '/test',
      headers: {},
      auth: { username: 'user', password: 'pass' },
    };
    const resolved = resolveConfig(config);
    const authHeader = resolved.headers.get('Authorization');
    expect(authHeader).toBe('Basic ' + btoa('user:pass'));
  });

  it('should handle auth with empty password', () => {
    const config = {
      url: '/test',
      headers: {},
      auth: { username: 'user' },
    };
    const resolved = resolveConfig(config);
    const authHeader = resolved.headers.get('Authorization');
    expect(authHeader).toBe('Basic ' + btoa('user:'));
  });

  it('should handle auth with empty username', () => {
    const config = {
      url: '/test',
      headers: {},
      auth: { password: 'pass' },
    };
    const resolved = resolveConfig(config);
    const authHeader = resolved.headers.get('Authorization');
    expect(authHeader).toBe('Basic ' + btoa(':pass'));
  });

  it('should handle auth with special characters in password', () => {
    const config = {
      url: '/test',
      headers: {},
      auth: { username: 'user', password: 'p@$$w\u00f6rd' },
    };
    const resolved = resolveConfig(config);
    const authHeader = resolved.headers.get('Authorization');
    expect(authHeader).toBeTruthy();
    expect(authHeader.startsWith('Basic ')).toBe(true);
  });

  it('should not set auth header when auth is not provided', () => {
    const config = { url: '/test', headers: {} };
    const resolved = resolveConfig(config);
    expect(resolved.headers.get('Authorization')).toBeFalsy();
  });
});
