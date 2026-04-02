import { describe, it, expect, vi } from 'vitest';
import callbackify from '../../../lib/helpers/callbackify.js';

describe('helpers::callbackify', () => {
  it('should return the function as-is if it is not async', () => {
    const fn = function (a, b) {
      return a + b;
    };
    const result = callbackify(fn);
    expect(result).toBe(fn);
  });

  it('should wrap an async function to accept a callback', async () => {
    const asyncFn = async (x) => x * 2;
    const wrapped = callbackify(asyncFn);

    const result = await new Promise((resolve) => {
      wrapped(5, (err, value) => {
        resolve({ err, value });
      });
    });

    expect(result.err).toBeNull();
    expect(result.value).toBe(10);
  });

  it('should pass rejection to the callback', async () => {
    const asyncFn = async () => {
      throw new Error('fail');
    };
    const wrapped = callbackify(asyncFn);

    const result = await new Promise((resolve) => {
      wrapped((err, value) => {
        resolve({ err, value });
      });
    });

    expect(result.err).toBeInstanceOf(Error);
    expect(result.err.message).toBe('fail');
  });

  it('should support a reducer function', async () => {
    const asyncFn = async (a, b) => ({ sum: a + b, product: a * b });
    const reducer = (value) => [value.sum, value.product];
    const wrapped = callbackify(asyncFn, reducer);

    const result = await new Promise((resolve) => {
      wrapped(3, 4, (err, sum, product) => {
        resolve({ err, sum, product });
      });
    });

    expect(result.err).toBeNull();
    expect(result.sum).toBe(7);
    expect(result.product).toBe(12);
  });

  it('should catch errors thrown in reducer and pass to callback', async () => {
    const asyncFn = async () => 'value';
    const reducer = () => {
      throw new Error('reducer error');
    };
    const wrapped = callbackify(asyncFn, reducer);

    const result = await new Promise((resolve) => {
      wrapped((err) => {
        resolve({ err });
      });
    });

    expect(result.err).toBeInstanceOf(Error);
    expect(result.err.message).toBe('reducer error');
  });
});
