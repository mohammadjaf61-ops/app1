import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import type { ApiResponse } from '@hypermarket/shared-types';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data is already wrapped in ApiResponse format, return as-is
        if (this.isApiResponse(data)) {
          return data as ApiResponse<T>;
        }

        // Wrap data in standard ApiResponse format
        return {
          success: true,
          data,
        };
      }),
    );
  }

  private isApiResponse(data: unknown): data is ApiResponse {
    return (
      typeof data === 'object' &&
      data !== null &&
      'success' in data &&
      typeof (data as ApiResponse).success === 'boolean'
    );
  }
}
