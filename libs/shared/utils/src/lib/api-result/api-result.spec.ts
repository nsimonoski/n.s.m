import { apiResult } from './api-result';

describe('apiResult', () => {
  it('should return success with data on resolved promise', async () => {
    const result = await apiResult(Promise.resolve({ id: 1 }));
    expect(result).toEqual({ success: true, data: { id: 1 }, error: null });
  });

  it('should return error message from Error instance', async () => {
    const result = await apiResult(Promise.reject(new Error('Something failed')));
    expect(result).toEqual({ success: false, data: null, error: 'Something failed' });
  });

  it('should extract error from response.data.message', async () => {
    const axiosError = { response: { data: { message: 'Validation failed' } } };
    const result = await apiResult(Promise.reject(axiosError));
    expect(result).toEqual({ success: false, data: null, error: 'Validation failed' });
  });

  it('should return "Unknown error" for non-Error thrown values', async () => {
    const result = await apiResult(Promise.reject('string error'));
    expect(result).toEqual({ success: false, data: null, error: 'Unknown error' });
  });

  it('should return "Unknown error" for null rejection', async () => {
    const result = await apiResult(Promise.reject(null));
    expect(result).toEqual({ success: false, data: null, error: 'Unknown error' });
  });
});
