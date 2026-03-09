import { HttpErrorResponse } from '@angular/common/http';
import { catchError, EMPTY, OperatorFunction } from 'rxjs';

export function handleError<T>(onError: (message: string) => void): OperatorFunction<T, T> {
  return (source) =>
    source.pipe(
      catchError((error: unknown) => {
        onError(extractMessage(error));
        return EMPTY;
      }),
    );
}

function extractMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    return error.error?.message ?? error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong';
}
