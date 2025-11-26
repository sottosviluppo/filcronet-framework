import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { ResponseHelper } from "../utils/response.helper";

/**
 * Global HTTP exception filter for standardizing error responses
 *
 * Catches all exceptions and transforms them into the standard
 * IApiResponse format. This ensures consistent error handling
 * across all endpoints.
 *
 * Features:
 * - Converts HttpExceptions to standardized format
 * - Extracts validation errors from class-validator
 * - Handles unknown errors gracefully
 * - Preserves HTTP status codes
 *
 * @export
 * @class HttpExceptionFilter
 * @implements {ExceptionFilter}
 *
 * @example
 * ```typescript
 * // Register globally in module
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_FILTER,
 *       useClass: HttpExceptionFilter,
 *     },
 *   ],
 * })
 * export class AppModule {}
 *
 * // Or in main.ts
 * app.useGlobalFilters(new HttpExceptionFilter());
 * ```
 *
 * @example
 * ```typescript
 * // Error response format
 * {
 *   "success": false,
 *   "message": "Validation failed",
 *   "errors": [
 *     { "message": "email must be an email" },
 *     { "message": "password must be at least 12 characters" }
 *   ],
 *   "meta": {
 *     "timestamp": "2024-01-15T10:30:00.000Z"
 *   }
 * }
 * ```
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  /**
   * Handles caught exceptions and transforms them to standard response
   *
   * @param {unknown} exception - The caught exception
   * @param {ArgumentsHost} host - Arguments host for accessing request/response
   * @memberof HttpExceptionFilter
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let apiResponse;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === "object" &&
        "message" in exceptionResponse
      ) {
        apiResponse = ResponseHelper.error(
          exceptionResponse.message as string,
          "errors" in exceptionResponse
            ? (exceptionResponse.errors as any[])
            : undefined
        );
      } else {
        apiResponse = ResponseHelper.error(exception.message);
      }
    } else if (exception instanceof Error) {
      apiResponse = ResponseHelper.error(exception.message);
    } else {
      apiResponse = ResponseHelper.error("Internal server error");
    }

    response.status(status).json(apiResponse);
  }
}
