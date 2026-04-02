import { describe, it, expect } from 'vitest';
import defaults from '../../../lib/defaults/index.js';
import AxiosHeaders from '../../../lib/core/AxiosHeaders.js';
import AxiosError from '../../../lib/core/AxiosError.js';

describe('defaults', () => {
  describe('structure', () => {
    it('should have adapter list', () => {
      expect(defaults.adapter).toEqual(['xhr', 'http', 'fetch']);
    });

    it('should have timeout of 0', () => {
      expect(defaults.timeout).toBe(0);
    });

    it('should have xsrf defaults', () => {
      expect(defaults.xsrfCookieName).toBe('XSRF-TOKEN');
      expect(defaults.xsrfHeaderName).toBe('X-XSRF-TOKEN');
    });

    it('should have content length defaults', () => {
      expect(defaults.maxContentLength).toBe(-1);
      expect(defaults.maxBodyLength).toBe(-1);
    });

    it('should have common Accept header', () => {
      expect(defaults.headers.common.Accept).toBe('application/json, text/plain, */*');
    });

    it('should have empty headers for each method', () => {
      ['delete', 'get', 'head', 'post', 'put', 'patch'].forEach((method) => {
        expect(defaults.headers[method]).toEqual({});
      });
    });

    it('should have transitional config', () => {
      expect(defaults.transitional).toBeDefined();
      expect(defaults.transitional.silentJSONParsing).toBe(true);
      expect(defaults.transitional.forcedJSONParsing).toBe(true);
      expect(defaults.transitional.clarifyTimeoutError).toBe(false);
    });
  });

  describe('validateStatus', () => {
    it('should return true for 2xx', () => {
      expect(defaults.validateStatus(200)).toBe(true);
      expect(defaults.validateStatus(299)).toBe(true);
    });

    it('should return false for non-2xx', () => {
      expect(defaults.validateStatus(199)).toBe(false);
      expect(defaults.validateStatus(300)).toBe(false);
      expect(defaults.validateStatus(404)).toBe(false);
      expect(defaults.validateStatus(500)).toBe(false);
    });
  });

  describe('transformRequest', () => {
    const transform = defaults.transformRequest[0];

    it('should stringify plain objects as JSON', () => {
      const headers = new AxiosHeaders();
      const result = transform.call({ }, { key: 'value' }, headers);
      expect(result).toBe('{"key":"value"}');
      expect(headers.getContentType()).toBe('application/json');
    });

    it('should return strings as-is', () => {
      const headers = new AxiosHeaders();
      const result = transform.call({}, 'hello', headers);
      expect(result).toBe('hello');
    });

    it('should return ArrayBuffer as-is', () => {
      const headers = new AxiosHeaders();
      const buffer = new ArrayBuffer(8);
      const result = transform.call({}, buffer, headers);
      expect(result).toBe(buffer);
    });

    it('should return Blob as-is', () => {
      const headers = new AxiosHeaders();
      const blob = new Blob(['test']);
      const result = transform.call({}, blob, headers);
      expect(result).toBe(blob);
    });

    it('should convert ArrayBufferView to its buffer', () => {
      const headers = new AxiosHeaders();
      const view = new Uint8Array([1, 2, 3]);
      const result = transform.call({}, view, headers);
      expect(result).toBe(view.buffer);
    });

    it('should convert URLSearchParams to string with correct content type', () => {
      const headers = new AxiosHeaders();
      const params = new URLSearchParams({ foo: 'bar' });
      const result = transform.call({}, params, headers);
      expect(result).toBe('foo=bar');
      expect(headers.getContentType()).toBe('application/x-www-form-urlencoded;charset=utf-8');
    });

    it('should parse valid JSON strings and return trimmed', () => {
      const headers = new AxiosHeaders({ 'Content-Type': 'application/json' });
      const result = transform.call({}, '  {"a":1}  ', headers);
      expect(result).toBe('{"a":1}');
    });
  });

  describe('transformResponse', () => {
    const transform = defaults.transformResponse[0];

    it('should parse JSON strings by default', () => {
      const result = transform.call(
        { transitional: defaults.transitional },
        '{"key":"value"}'
      );
      expect(result).toEqual({ key: 'value' });
    });

    it('should return non-string data as-is', () => {
      const obj = { key: 'value' };
      const result = transform.call(
        { transitional: defaults.transitional },
        obj
      );
      expect(result).toBe(obj);
    });

    it('should return invalid JSON as string with silentJSONParsing', () => {
      const result = transform.call(
        { transitional: { ...defaults.transitional, silentJSONParsing: true } },
        'not json'
      );
      expect(result).toBe('not json');
    });

    it('should throw AxiosError for invalid JSON when responseType is json and silentJSONParsing is false', () => {
      expect(() => {
        transform.call(
          {
            responseType: 'json',
            transitional: { ...defaults.transitional, silentJSONParsing: false },
          },
          'not json'
        );
      }).toThrow(AxiosError);
    });

    it('should not parse when responseType is set to non-json', () => {
      const result = transform.call(
        {
          responseType: 'text',
          transitional: defaults.transitional,
        },
        '{"key":"value"}'
      );
      expect(result).toBe('{"key":"value"}');
    });

    it('should support parseReviver option', () => {
      const reviver = (key, value) => (key === 'num' ? value * 2 : value);
      const result = transform.call(
        { transitional: defaults.transitional, parseReviver: reviver },
        '{"num":5}'
      );
      expect(result).toEqual({ num: 10 });
    });
  });
});
