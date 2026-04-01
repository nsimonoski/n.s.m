import { catchError, map, Observable, of, OperatorFunction } from 'rxjs';
import type { ApiSuccess, ApiError, ApiResult } from '@org/shared/utils';

export type { ApiResult, ApiSuccess, ApiError };

function extractErrorMessage(err: unknown): string {
  const httpBody = (err as Record<string, unknown>)?.['error'];
  if (httpBody && typeof httpBody === 'object' && 'message' in httpBody) {
    return String((httpBody as Record<string, unknown>)['message']);
  }
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}

export function apiResult<T>(): OperatorFunction<T, ApiResult<T>> {
  return (source: Observable<T>) =>
    source.pipe(
      map((data): ApiSuccess<T> => ({ success: true, data, error: null })),
      catchError((err: unknown) =>
        of<ApiError>({
          success: false,
          data: null,
          error: extractErrorMessage(err),
        }),
      ),
    );
}
