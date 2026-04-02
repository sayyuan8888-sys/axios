import { describe, it, expect, vi } from 'vitest';
import { streamChunk, readBytes, trackStream } from '../../../lib/helpers/trackStream.js';

describe('helpers::trackStream', () => {
  describe('streamChunk', () => {
    it('should yield the entire chunk if no chunkSize', () => {
      const chunk = new Uint8Array([1, 2, 3, 4, 5]);
      const chunks = [...streamChunk(chunk)];
      expect(chunks.length).toBe(1);
      expect(chunks[0]).toBe(chunk);
    });

    it('should yield the entire chunk if chunk is smaller than chunkSize', () => {
      const chunk = new Uint8Array([1, 2, 3]);
      const chunks = [...streamChunk(chunk, 10)];
      expect(chunks.length).toBe(1);
      expect(chunks[0]).toBe(chunk);
    });

    it('should split chunk into pieces of chunkSize', () => {
      const chunk = new Uint8Array([1, 2, 3, 4, 5, 6]);
      const chunks = [...streamChunk(chunk, 2)];
      expect(chunks.length).toBe(3);
      expect(chunks[0].byteLength).toBe(2);
      expect(chunks[1].byteLength).toBe(2);
      expect(chunks[2].byteLength).toBe(2);
    });

    it('should handle uneven splits', () => {
      const chunk = new Uint8Array([1, 2, 3, 4, 5]);
      const chunks = [...streamChunk(chunk, 2)];
      expect(chunks.length).toBe(3);
      expect(chunks[2].byteLength).toBe(1);
    });
  });

  describe('readBytes', () => {
    it('should read all bytes from an async iterable', async () => {
      async function* source() {
        yield new Uint8Array([1, 2, 3]);
        yield new Uint8Array([4, 5, 6]);
      }

      const chunks = [];
      for await (const chunk of readBytes(source())) {
        chunks.push(chunk);
      }
      expect(chunks.length).toBe(2);
    });

    it('should re-chunk with chunkSize', async () => {
      async function* source() {
        yield new Uint8Array([1, 2, 3, 4]);
      }

      const chunks = [];
      for await (const chunk of readBytes(source(), 2)) {
        chunks.push(chunk);
      }
      expect(chunks.length).toBe(2);
      expect(chunks[0].byteLength).toBe(2);
      expect(chunks[1].byteLength).toBe(2);
    });
  });

  describe('trackStream', () => {
    it('should return a ReadableStream', () => {
      const source = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        },
      });

      const tracked = trackStream(source, undefined, () => {}, () => {});
      expect(tracked).toBeInstanceOf(ReadableStream);
    });

    it('should call onProgress with accumulated bytes', async () => {
      const source = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.enqueue(new Uint8Array([4, 5]));
          controller.close();
        },
      });

      const progressCalls = [];
      const tracked = trackStream(source, undefined, (loaded) => {
        progressCalls.push(loaded);
      }, () => {});

      const reader = tracked.getReader();
      while (!(await reader.read()).done) {}

      expect(progressCalls).toEqual([3, 5]);
    });

    it('should call onFinish when stream ends', async () => {
      const source = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1]));
          controller.close();
        },
      });

      const onFinish = vi.fn();
      const tracked = trackStream(source, undefined, () => {}, onFinish);

      const reader = tracked.getReader();
      while (!(await reader.read()).done) {}

      expect(onFinish).toHaveBeenCalledTimes(1);
    });

    it('should call onFinish only once', async () => {
      const source = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });

      const onFinish = vi.fn();
      const tracked = trackStream(source, undefined, () => {}, onFinish);

      const reader = tracked.getReader();
      await reader.read(); // done

      expect(onFinish).toHaveBeenCalledTimes(1);
    });

    it('should call onFinish with error on cancel', async () => {
      const source = new ReadableStream({
        start() {
          // Never closes — we cancel externally
        },
      });

      const onFinish = vi.fn();
      const tracked = trackStream(source, undefined, () => {}, onFinish);

      const reader = tracked.getReader();
      await reader.cancel('user abort');

      expect(onFinish).toHaveBeenCalledWith('user abort');
    });
  });
});
