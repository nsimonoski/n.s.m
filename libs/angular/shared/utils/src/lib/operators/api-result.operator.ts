import { catchError, map, Observable, of, OperatorFunction } from 'rxjs';
import type { ApiSuccess, ApiError, ApiResult } from '@org/shared/utils';

export type { ApiResult, ApiSuccess, ApiError };

export function apiResult<T>(): OperatorFunction<T, ApiResult<T>> {
  return (source: Observable<T>) =>
    source.pipe(
      map((data): ApiSuccess<T> => ({ success: true, data, error: null })),
      catchError((err: unknown) =>
        of<ApiError>({
          success: false,
          data: null,
          error: err instanceof Error ? err.message : 'Unknown error',
        }),
      ),
    );
}
