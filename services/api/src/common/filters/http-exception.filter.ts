import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Standard error response format per PROMPT 04
 */
interface ErrorResponse {
  statusCode: number;
  message: string;
  errorCode: string;
  correlationId?: string;
  timestamp: string;
}

interface ExceptionResponse {
  message?: string | string[];
  error?: string;
  errorCode?: string;
  statusCode?: number;
}

/**
 * Error codes mapping
 */
const ERROR_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_SERVER_ERROR',
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = request['correlationId'];

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'حدث خطأ في الخادم'; // Internal server error in Arabic
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as
        | ExceptionResponse
        | string;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        // Handle validation errors (array of messages)
        if (Array.isArray(exceptionResponse.message)) {
          message = exceptionResponse.message.join(', ');
        } else {
          message =
            exceptionResponse.message ||
            exceptionResponse.error ||
            message;
        }
        // Use custom error code if provided
        errorCode =
          exceptionResponse.errorCode || ERROR_CODES[status] || errorCode;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Default error code from status
    if (!errorCode || errorCode === 'INTERNAL_SERVER_ERROR') {
      errorCode = ERROR_CODES[status] || 'INTERNAL_SERVER_ERROR';
    }

    // Log error with correlation ID
    this.logger.error(
      JSON.stringify({
        correlationId,
        method: request.method,
        url: request.url,
        statusCode: status,
        errorCode,
        message,
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    );

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      errorCode,
      correlationId,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(errorResponse);
  }
}
