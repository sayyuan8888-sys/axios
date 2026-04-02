import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  progressEventReducer,
  progressEventDecorator,
  asyncDecorator,
} from '../../../lib/helpers/progressEventReducer.js';

describe('helpers::progressEventReducer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return [throttled, flush] tuple', () => {
    const result = progressEventReducer(() => {});
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });

  it('should call listener with progress data on first event', () => {
    const listener = vi.fn();
    const [throttled] = progressEventReducer(listener);
    throttled({ loaded: 100, lengthComputable: true, total: 1000 });
    expect(listener).toHaveBeenCalledTimes(1);
    const data = listener.mock.calls[0][0];
    expect(data.loaded).toBe(100);
    expect(data.total).toBe(1000);
    expect(data.progress).toBeCloseTo(0.1);
    expect(data.bytes).toBe(100);
    expect(data.lengthComputable).toBe(true);
  });

  it('should set download: true for download streams', () => {
    const listener = vi.fn();
    const [throttled] = progressEventReducer(listener, true);
    throttled({ loaded: 50, lengthComputable: false, total: undefined });
    expect(listener.mock.calls[0][0].download).toBe(true);
    expect(listener.mock.calls[0][0].upload).toBeUndefined();
  });

  it('should set upload: true for upload streams', () => {
    const listener = vi.fn();
    const [throttled] = progressEventReducer(listener, false);
    throttled({ loaded: 50, lengthComputable: false, total: undefined });
    expect(listener.mock.calls[0][0].upload).toBe(true);
    expect(listener.mock.calls[0][0].download).toBeUndefined();
  });

  it('should track bytes as delta from previous notification', () => {
    const listener = vi.fn();
    const [throttled] = progressEventReducer(listener, false, 1000);
    throttled({ loaded: 100, lengthComputable: true, total: 500 });
    vi.advanceTimersByTime(1000);
    throttled({ loaded: 300, lengthComputable: true, total: 500 });
    expect(listener.mock.calls[1][0].bytes).toBe(200);
  });

  it('should include the original event', () => {
    const listener = vi.fn();
    const [throttled] = progressEventReducer(listener);
    const event = { loaded: 50, lengthComputable: true, total: 100 };
    throttled(event);
    expect(listener.mock.calls[0][0].event).toBe(event);
  });

  it('should handle lengthComputable: false', () => {
    const listener = vi.fn();
    const [throttled] = progressEventReducer(listener);
    throttled({ loaded: 50, lengthComputable: false, total: undefined });
    const data = listener.mock.calls[0][0];
    expect(data.total).toBeUndefined();
    expect(data.progress).toBeUndefined();
    expect(data.lengthComputable).toBe(false);
  });
});

describe('helpers::progressEventDecorator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return [wrappedHandler, flush] tuple', () => {
    const listener = vi.fn();
    const throttled = progressEventReducer(listener);
    const result = progressEventDecorator(100, throttled);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });

  it('should create progress events from loaded bytes', () => {
    const listener = vi.fn();
    const throttled = progressEventReducer(listener);
    const [handler] = progressEventDecorator(100, throttled);
    handler(50);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].loaded).toBe(50);
    expect(listener.mock.calls[0][0].total).toBe(100);
    expect(listener.mock.calls[0][0].lengthComputable).toBe(true);
  });

  it('should handle null total', () => {
    const listener = vi.fn();
    const throttled = progressEventReducer(listener);
    const [handler] = progressEventDecorator(null, throttled);
    handler(50);
    expect(listener.mock.calls[0][0].lengthComputable).toBe(false);
  });
});

describe('helpers::asyncDecorator', () => {
  it('should call function asynchronously', async () => {
    const fn = vi.fn();
    const async_fn = asyncDecorator(fn);
    async_fn('a', 'b');
    expect(fn).not.toHaveBeenCalled();
    await new Promise((r) => setTimeout(r, 0));
    expect(fn).toHaveBeenCalledWith('a', 'b');
  });
});
