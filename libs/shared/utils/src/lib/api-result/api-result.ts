export type ApiSuccess<T> = { success: true; data: T; error: null };
export type ApiError = { success: false; data: null; error: string };
export type ApiResult<T> = ApiSuccess<T> | ApiError;

export async function apiResult<T>(promise: Promise<T>): Promise<ApiResult<T>> {
  try {
    const data = await promise;
    return { success: true, data, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      data: null,
      error: extractErrorMessage(err),
    };
  }
}

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (message) return message;
  }
  return err instanceof Error ? err.message : 'Unknown error';
}
