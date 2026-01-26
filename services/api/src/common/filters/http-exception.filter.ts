import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import type { ApiResponse, ApiError } from '@hypermarket/shared-types';

interface ExceptionResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: ApiError[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as ExceptionResponse | string;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        message = exceptionResponse.error || exceptionResponse.message?.toString() || message;

        // Handle validation errors
        if (Array.isArray(exceptionResponse.message)) {
          errors = exceptionResponse.message.map((msg: string) => ({
            code: 'VALIDATION_ERROR',
            message: msg,
          }));
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log error
    this.logger.error(
      `${request.method} ${request.url} - ${status}: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const errorResponse: ApiResponse = {
      success: false,
      message,
      errors: errors.length > 0 ? errors : [{ code: String(status), message }],
    };

    response.status(status).json(errorResponse);
  }
}
