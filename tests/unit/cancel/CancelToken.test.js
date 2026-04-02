import { describe, it, expect, vi } from 'vitest';
import CancelToken from '../../../lib/cancel/CancelToken.js';
import CanceledError from '../../../lib/cancel/CanceledError.js';

describe('CancelToken', () => {
  describe('constructor', () => {
    it('should throw if executor is not a function', () => {
      expect(() => new CancelToken()).toThrow(TypeError);
      expect(() => new CancelToken('string')).toThrow('executor must be a function.');
    });

    it('should provide a cancel function to the executor', () => {
      let cancelFn;
      new CancelToken((c) => {
        cancelFn = c;
      });
      expect(typeof cancelFn).toBe('function');
    });

    it('should set reason when cancel is called', () => {
      const { token, cancel } = CancelToken.source();
      cancel('Operation canceled');
      expect(token.reason).toBeInstanceOf(CanceledError);
      expect(token.reason.message).toBe('Operation canceled');
    });

    it('should ignore subsequent cancel calls', () => {
      const { token, cancel } = CancelToken.source();
      cancel('first');
      cancel('second');
      expect(token.reason.message).toBe('first');
    });
  });

  describe('throwIfRequested()', () => {
    it('should not throw if not canceled', () => {
      const { token } = CancelToken.source();
      expect(() => token.throwIfRequested()).not.toThrow();
    });

    it('should throw CanceledError if canceled', () => {
      const { token, cancel } = CancelToken.source();
      cancel('canceled');
      expect(() => token.throwIfRequested()).toThrow(CanceledError);
    });
  });

  describe('subscribe() / unsubscribe()', () => {
    it('should call listeners when token is canceled', async () => {
      const { token, cancel } = CancelToken.source();
      const listener = vi.fn();
      token.subscribe(listener);
      cancel('done');
      // Listeners are called via promise.then, so wait a tick
      await new Promise((r) => setTimeout(r, 0));
      expect(listener).toHaveBeenCalledWith(token.reason);
    });

    it('should call listener immediately if already canceled', () => {
      const { token, cancel } = CancelToken.source();
      cancel('done');
      const listener = vi.fn();
      token.subscribe(listener);
      expect(listener).toHaveBeenCalledWith(token.reason);
    });

    it('should remove listener via unsubscribe', async () => {
      const { token, cancel } = CancelToken.source();
      const listener = vi.fn();
      token.subscribe(listener);
      token.unsubscribe(listener);
      cancel('done');
      await new Promise((r) => setTimeout(r, 0));
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle unsubscribe when no listeners exist', () => {
      const { token } = CancelToken.source();
      expect(() => token.unsubscribe(() => {})).not.toThrow();
    });
  });

  describe('toAbortSignal()', () => {
    it('should return an AbortSignal', () => {
      const { token } = CancelToken.source();
      const signal = token.toAbortSignal();
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal.aborted).toBe(false);
    });

    it('should abort the signal when token is canceled', async () => {
      const { token, cancel } = CancelToken.source();
      const signal = token.toAbortSignal();
      cancel('aborted');
      await new Promise((r) => setTimeout(r, 0));
      expect(signal.aborted).toBe(true);
    });

    it('should provide an unsubscribe method on the signal', () => {
      const { token } = CancelToken.source();
      const signal = token.toAbortSignal();
      expect(typeof signal.unsubscribe).toBe('function');
    });
  });

  describe('source()', () => {
    it('should return an object with token and cancel', () => {
      const source = CancelToken.source();
      expect(source.token).toBeInstanceOf(CancelToken);
      expect(typeof source.cancel).toBe('function');
    });
  });

  describe('promise', () => {
    it('should resolve promise when canceled', async () => {
      const { token, cancel } = CancelToken.source();
      const promise = token.promise;
      cancel('test');
      const reason = await promise;
      expect(reason).toBeInstanceOf(CanceledError);
    });
  });
});
