import { describe, it, expect, vi } from 'vitest';
import settle from '../../../lib/core/settle.js';
import AxiosError from '../../../lib/core/AxiosError.js';

const makeResponse = (status, config = {}) => ({
  status,
  config: { validateStatus: (s) => s >= 200 && s < 300, ...config },
  request: {},
  data: 'test',
});

describe('core::settle', () => {
  it('should resolve for 2xx status codes', () => {
    const resolve = vi.fn();
    const reject = vi.fn();
    const response = makeResponse(200);
    settle(resolve, reject, response);
    expect(resolve).toHaveBeenCalledWith(response);
    expect(reject).not.toHaveBeenCalled();
  });

  it('should resolve for 201', () => {
    const resolve = vi.fn();
    const reject = vi.fn();
    settle(resolve, reject, makeResponse(201));
    expect(resolve).toHaveBeenCalled();
  });

  it('should reject for 4xx status codes', () => {
    const resolve = vi.fn();
    const reject = vi.fn();
    settle(resolve, reject, makeResponse(400));
    expect(reject).toHaveBeenCalled();
    expect(resolve).not.toHaveBeenCalled();
    const error = reject.mock.calls[0][0];
    expect(error).toBeInstanceOf(AxiosError);
    expect(error.message).toBe('Request failed with status code 400');
    expect(error.code).toBe(AxiosError.ERR_BAD_REQUEST);
  });

  it('should reject for 5xx status codes', () => {
    const resolve = vi.fn();
    const reject = vi.fn();
    settle(resolve, reject, makeResponse(500));
    expect(reject).toHaveBeenCalled();
    const error = reject.mock.calls[0][0];
    expect(error.code).toBe(AxiosError.ERR_BAD_RESPONSE);
  });

  it('should use ERR_BAD_REQUEST for 4xx', () => {
    const reject = vi.fn();
    settle(vi.fn(), reject, makeResponse(404));
    expect(reject.mock.calls[0][0].code).toBe(AxiosError.ERR_BAD_REQUEST);
  });

  it('should use ERR_BAD_RESPONSE for 5xx', () => {
    const reject = vi.fn();
    settle(vi.fn(), reject, makeResponse(503));
    expect(reject.mock.calls[0][0].code).toBe(AxiosError.ERR_BAD_RESPONSE);
  });

  it('should resolve when validateStatus is null', () => {
    const resolve = vi.fn();
    const reject = vi.fn();
    const response = {
      status: 500,
      config: { validateStatus: null },
      request: {},
    };
    settle(resolve, reject, response);
    expect(resolve).toHaveBeenCalledWith(response);
  });

  it('should resolve when response has no status', () => {
    const resolve = vi.fn();
    const reject = vi.fn();
    const response = {
      status: 0,
      config: { validateStatus: (s) => s >= 200 && s < 300 },
      request: {},
    };
    settle(resolve, reject, response);
    expect(resolve).toHaveBeenCalledWith(response);
  });

  it('should support custom validateStatus', () => {
    const resolve = vi.fn();
    const reject = vi.fn();
    const response = {
      status: 302,
      config: { validateStatus: (s) => s >= 200 && s < 400 },
      request: {},
    };
    settle(resolve, reject, response);
    expect(resolve).toHaveBeenCalledWith(response);
  });

  it('should include config, request and response in error', () => {
    const reject = vi.fn();
    const response = makeResponse(400);
    settle(vi.fn(), reject, response);
    const error = reject.mock.calls[0][0];
    expect(error.config).toBe(response.config);
    expect(error.request).toBe(response.request);
    expect(error.response).toBe(response);
  });
});
