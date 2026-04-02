import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import speedometer from '../../../lib/helpers/speedometer.js';

describe('helpers::speedometer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return a function', () => {
    const push = speedometer();
    expect(typeof push).toBe('function');
  });

  it('should return undefined when min time has not elapsed', () => {
    const push = speedometer(10, 1000);
    const result = push(100);
    expect(result).toBeUndefined();
  });

  it('should return a rate after min time has elapsed', () => {
    const push = speedometer(10, 500);
    push(100);
    vi.advanceTimersByTime(600);
    const rate = push(200);
    expect(typeof rate).toBe('number');
    expect(rate).toBeGreaterThan(0);
  });

  it('should calculate rate in bytes per second', () => {
    const push = speedometer(10, 100);
    push(0); // initialize
    vi.advanceTimersByTime(200);
    push(1000);
    vi.advanceTimersByTime(200);
    const rate = push(1000);
    // We pushed 2000 bytes over ~400ms
    expect(rate).toBeGreaterThan(0);
  });

  it('should use default samplesCount of 10 and min of 1000', () => {
    const push = speedometer();
    push(100);
    // Before 1000ms, should return undefined
    vi.advanceTimersByTime(500);
    expect(push(100)).toBeUndefined();
    // After 1000ms, should return a number
    vi.advanceTimersByTime(600);
    expect(push(100)).toBeGreaterThan(0);
  });

  it('should work as a circular buffer with limited samples', () => {
    const push = speedometer(3, 100);
    push(100);
    vi.advanceTimersByTime(50);
    push(100);
    vi.advanceTimersByTime(50);
    push(100);
    vi.advanceTimersByTime(50);
    // This should overwrite the oldest sample
    const rate = push(100);
    expect(typeof rate).toBe('number');
  });
});
