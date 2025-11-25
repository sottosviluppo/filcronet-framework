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
 * Global exception filter to standardize error responses
 *
 * @export
 * @class HttpExceptionFilter
 * @implements {ExceptionFilter}
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
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
