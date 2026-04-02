import { describe, it, expect } from 'vitest';
import AxiosURLSearchParams from '../../../lib/helpers/AxiosURLSearchParams.js';

describe('helpers::AxiosURLSearchParams', () => {
  it('should create an instance with empty pairs', () => {
    const params = new AxiosURLSearchParams();
    expect(params._pairs).toEqual([]);
  });

  it('should accept params object and populate pairs', () => {
    const params = new AxiosURLSearchParams({ foo: 'bar', baz: 'qux' });
    expect(params._pairs.length).toBeGreaterThan(0);
  });

  describe('append()', () => {
    it('should add name-value pairs', () => {
      const params = new AxiosURLSearchParams();
      params.append('key', 'value');
      expect(params._pairs).toEqual([['key', 'value']]);
    });

    it('should allow multiple pairs with the same name', () => {
      const params = new AxiosURLSearchParams();
      params.append('key', 'a');
      params.append('key', 'b');
      expect(params._pairs.length).toBe(2);
    });
  });

  describe('toString()', () => {
    it('should encode pairs as a query string', () => {
      const params = new AxiosURLSearchParams();
      params.append('foo', 'bar');
      params.append('baz', 'qux');
      expect(params.toString()).toBe('foo=bar&baz=qux');
    });

    it('should encode special characters', () => {
      const params = new AxiosURLSearchParams();
      params.append('key', 'hello world');
      expect(params.toString()).toBe('key=hello+world');
    });

    it('should encode ! as %21', () => {
      const params = new AxiosURLSearchParams();
      params.append('key', 'hello!');
      expect(params.toString()).toContain('%21');
    });

    it("should encode ' as %27", () => {
      const params = new AxiosURLSearchParams();
      params.append('key', "it's");
      expect(params.toString()).toContain('%27');
    });

    it('should encode ( and ) as %28 and %29', () => {
      const params = new AxiosURLSearchParams();
      params.append('key', '(test)');
      const str = params.toString();
      expect(str).toContain('%28');
      expect(str).toContain('%29');
    });

    it('should encode ~ as %7E', () => {
      const params = new AxiosURLSearchParams();
      params.append('key', '~tilde');
      expect(params.toString()).toContain('%7E');
    });

    it('should support custom encoder', () => {
      const params = new AxiosURLSearchParams();
      params.append('foo', 'bar');
      const result = params.toString((value) => value.toUpperCase());
      expect(result).toBe('FOO=BAR');
    });

    it('should return empty string for no pairs', () => {
      const params = new AxiosURLSearchParams();
      expect(params.toString()).toBe('');
    });
  });
});
