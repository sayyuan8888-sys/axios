import { describe, it, expect, vi } from 'vitest';
import dispatchRequest from '../../../lib/core/dispatchRequest.js';
import AxiosHeaders from '../../../lib/core/AxiosHeaders.js';
import CanceledError from '../../../lib/cancel/CanceledError.js';
import CancelToken from '../../../lib/cancel/CancelToken.js';

const mockAdapter = (responseData = { data: 'ok' }) => {
  return vi.fn((config) =>
    Promise.resolve({
      data: responseData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    })
  );
};

const baseConfig = (overrides = {}) => ({
  method: 'get',
  headers: new AxiosHeaders(),
  transformRequest: [],
  transformResponse: [],
  adapter: mockAdapter(),
  ...overrides,
});

describe('dispatchRequest', () => {
  it('should return a promise', () => {
    const result = dispatchRequest(baseConfig());
    expect(result).toBeInstanceOf(Promise);
  });

  it('should call the adapter with the config', async () => {
    const adapter = mockAdapter();
    const config = baseConfig({ adapter });
    await dispatchRequest(config);
    expect(adapter).toHaveBeenCalledWith(config);
  });

  it('should convert headers to AxiosHeaders', async () => {
    const adapter = mockAdapter();
    const config = baseConfig({ adapter, headers: { 'X-Test': '1' } });
    await dispatchRequest(config);
    expect(adapter.mock.calls[0][0].headers).toBeInstanceOf(AxiosHeaders);
  });

  it('should set default content-type for post requests', async () => {
    const adapter = mockAdapter();
    const config = baseConfig({ adapter, method: 'post' });
    await dispatchRequest(config);
    const headers = adapter.mock.calls[0][0].headers;
    expect(headers.getContentType()).toBe('application/x-www-form-urlencoded');
  });

  it('should set default content-type for put requests', async () => {
    const adapter = mockAdapter();
    const config = baseConfig({ adapter, method: 'put' });
    await dispatchRequest(config);
    const headers = adapter.mock.calls[0][0].headers;
    expect(headers.getContentType()).toBe('application/x-www-form-urlencoded');
  });

  it('should set default content-type for patch requests', async () => {
    const adapter = mockAdapter();
    const config = baseConfig({ adapter, method: 'patch' });
    await dispatchRequest(config);
    const headers = adapter.mock.calls[0][0].headers;
    expect(headers.getContentType()).toBe('application/x-www-form-urlencoded');
  });

  it('should NOT set default content-type for get requests', async () => {
    const adapter = mockAdapter();
    const config = baseConfig({ adapter, method: 'get' });
    await dispatchRequest(config);
    const headers = adapter.mock.calls[0][0].headers;
    expect(headers.getContentType()).toBeUndefined();
  });

  it('should wrap response headers in AxiosHeaders on success', async () => {
    const response = await dispatchRequest(baseConfig());
    expect(response.headers).toBeInstanceOf(AxiosHeaders);
  });

  it('should apply transformResponse on success', async () => {
    const transform = (data) => ({ ...data, transformed: true });
    const config = baseConfig({
      transformResponse: [transform],
      adapter: mockAdapter({ original: true }),
    });
    const response = await dispatchRequest(config);
    expect(response.data.transformed).toBe(true);
  });

  it('should apply transformResponse on error response', async () => {
    const transform = (data) => ({ ...data, transformed: true });
    const config = baseConfig({
      transformResponse: [transform],
      adapter: vi.fn(() =>
        Promise.reject({
          response: {
            data: { error: true },
            headers: {},
          },
        })
      ),
    });

    try {
      await dispatchRequest(config);
    } catch (reason) {
      expect(reason.response.data.transformed).toBe(true);
      expect(reason.response.headers).toBeInstanceOf(AxiosHeaders);
    }
  });

  describe('cancellation', () => {
    it('should throw CanceledError if cancelToken is already canceled', async () => {
      const { token, cancel } = CancelToken.source();
      cancel('pre-canceled');

      try {
        await dispatchRequest(baseConfig({ cancelToken: token }));
        expect.unreachable('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(CanceledError);
      }
    });

    it('should throw CanceledError if signal is already aborted', async () => {
      const controller = new AbortController();
      controller.abort();

      try {
        await dispatchRequest(baseConfig({ signal: controller.signal }));
        expect.unreachable('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(CanceledError);
      }
    });

    it('should not re-throw if error is already a CanceledError', async () => {
      const canceledError = new CanceledError('canceled');
      const config = baseConfig({
        adapter: vi.fn(() => Promise.reject(canceledError)),
      });

      await expect(dispatchRequest(config)).rejects.toBe(canceledError);
    });
  });
});
