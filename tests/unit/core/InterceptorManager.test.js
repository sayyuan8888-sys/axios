import { describe, it, expect, beforeEach } from 'vitest';
import InterceptorManager from '../../../lib/core/InterceptorManager.js';

describe('InterceptorManager', () => {
  let manager;

  beforeEach(() => {
    manager = new InterceptorManager();
  });

  describe('use()', () => {
    it('should add a handler and return an incrementing ID', () => {
      const id1 = manager.use(() => {});
      const id2 = manager.use(() => {});
      expect(id1).toBe(0);
      expect(id2).toBe(1);
    });

    it('should store fulfilled and rejected handlers', () => {
      const fulfilled = () => {};
      const rejected = () => {};
      manager.use(fulfilled, rejected);
      expect(manager.handlers[0].fulfilled).toBe(fulfilled);
      expect(manager.handlers[0].rejected).toBe(rejected);
    });

    it('should default synchronous to false and runWhen to null', () => {
      manager.use(() => {});
      expect(manager.handlers[0].synchronous).toBe(false);
      expect(manager.handlers[0].runWhen).toBe(null);
    });

    it('should store synchronous option', () => {
      manager.use(() => {}, null, { synchronous: true });
      expect(manager.handlers[0].synchronous).toBe(true);
    });

    it('should store runWhen option', () => {
      const runWhen = (config) => config.method === 'get';
      manager.use(() => {}, null, { runWhen });
      expect(manager.handlers[0].runWhen).toBe(runWhen);
    });
  });

  describe('eject()', () => {
    it('should set handler to null by ID', () => {
      const id = manager.use(() => {});
      expect(manager.handlers[id]).not.toBeNull();
      manager.eject(id);
      expect(manager.handlers[id]).toBeNull();
    });

    it('should not affect other handlers', () => {
      const id1 = manager.use(() => {});
      const id2 = manager.use(() => {});
      manager.eject(id1);
      expect(manager.handlers[id1]).toBeNull();
      expect(manager.handlers[id2]).not.toBeNull();
    });

    it('should do nothing for invalid IDs', () => {
      manager.use(() => {});
      manager.eject(99);
      expect(manager.handlers.length).toBe(1);
      expect(manager.handlers[0]).not.toBeNull();
    });
  });

  describe('clear()', () => {
    it('should remove all handlers', () => {
      manager.use(() => {});
      manager.use(() => {});
      manager.clear();
      expect(manager.handlers.length).toBe(0);
    });
  });

  describe('forEach()', () => {
    it('should iterate over all non-null handlers', () => {
      const fn1 = () => {};
      const fn2 = () => {};
      manager.use(fn1);
      manager.use(fn2);

      const visited = [];
      manager.forEach((h) => visited.push(h.fulfilled));

      expect(visited).toEqual([fn1, fn2]);
    });

    it('should skip ejected (null) handlers', () => {
      manager.use(() => 'a');
      const id = manager.use(() => 'b');
      manager.use(() => 'c');
      manager.eject(id);

      const visited = [];
      manager.forEach((h) => visited.push(h));
      expect(visited.length).toBe(2);
    });

    it('should handle empty handlers list', () => {
      const visited = [];
      manager.forEach((h) => visited.push(h));
      expect(visited.length).toBe(0);
    });
  });
});
