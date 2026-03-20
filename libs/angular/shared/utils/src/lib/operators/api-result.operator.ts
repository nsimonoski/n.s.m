import { catchError, map, Observable, of, OperatorFunction } from 'rxjs';

export type ApiSuccess<T> = { success: true; data: T; error: null };
export type ApiError = { success: false; data: null; error: string };
export type ApiResult<T> = ApiSuccess<T> | ApiError;

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
