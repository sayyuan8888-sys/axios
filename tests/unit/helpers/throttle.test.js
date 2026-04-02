import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import throttle from '../../../lib/helpers/throttle.js';

describe('helpers::throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return an array with [throttled, flush]', () => {
    const result = throttle(() => {}, 10);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(typeof result[0]).toBe('function');
    expect(typeof result[1]).toBe('function');
  });

  it('should invoke immediately on first call', () => {
    const fn = vi.fn();
    const [throttled] = throttle(fn, 10);
    throttled('a');
    expect(fn).toHaveBeenCalledWith('a');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should not invoke again within the threshold', () => {
    const fn = vi.fn();
    const [throttled] = throttle(fn, 10); // threshold = 100ms
    throttled('a');
    vi.advanceTimersByTime(50);
    throttled('b');
    // Only the first call should have fired synchronously
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('should invoke deferred call after threshold elapses', () => {
    const fn = vi.fn();
    const [throttled] = throttle(fn, 10); // threshold = 100ms
    throttled('a');
    vi.advanceTimersByTime(50);
    throttled('b');
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('b');
  });

  it('should invoke again after threshold has passed', () => {
    const fn = vi.fn();
    const [throttled] = throttle(fn, 10); // threshold = 100ms
    throttled('a');
    vi.advanceTimersByTime(100);
    throttled('b');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('b');
  });

  it('should use the latest args for deferred invocation', () => {
    const fn = vi.fn();
    const [throttled] = throttle(fn, 10); // threshold = 100ms
    throttled('a');
    vi.advanceTimersByTime(30);
    throttled('b');
    vi.advanceTimersByTime(30);
    throttled('c'); // should replace 'b' as the pending args
    vi.advanceTimersByTime(40);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('c');
  });

  describe('flush()', () => {
    it('should invoke pending deferred call immediately', () => {
      const fn = vi.fn();
      const [throttled, flush] = throttle(fn, 10);
      throttled('a');
      vi.advanceTimersByTime(50);
      throttled('b');
      flush();
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith('b');
    });

    it('should do nothing if no pending call', () => {
      const fn = vi.fn();
      const [, flush] = throttle(fn, 10);
      flush();
      expect(fn).not.toHaveBeenCalled();
    });
  });
});
