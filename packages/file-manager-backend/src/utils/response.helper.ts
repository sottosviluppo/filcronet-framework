import type { IApiResponse, IApiError } from "@sottosviluppo/core";

/**
 * Helper class for creating standardized API responses
 *
 * @export
 * @class ResponseHelper
 *
 * @example
 * ```typescript
 * // Success with data
 * return ResponseHelper.success(file, 'File uploaded successfully');
 *
 * // Success without data
 * return ResponseHelper.successMessage('File deleted successfully');
 *
 * // Error response
 * return ResponseHelper.error('Validation failed', [
 *   { field: 'file', message: 'File type not allowed' }
 * ]);
 * ```
 */
export class ResponseHelper {
  /**
   * Creates a success response with data
   *
   * @static
   * @template T - Type of the response data
   * @param {T} data - Data to include in response
   * @param {string} [message] - Optional success message
   * @returns {IApiResponse<T>} Standardized success response
   * @memberof ResponseHelper
   */
  static success<T>(data: T, message?: string): IApiResponse<T> {
    return {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Creates a success response without data (message only)
   *
   * @static
   * @param {string} message - Success message
   * @returns {IApiResponse<void>} Standardized success response
   * @memberof ResponseHelper
   */
  static successMessage(message: string): IApiResponse<void> {
    return {
      success: true,
      message,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Creates an error response
   *
   * @static
   * @param {string} message - Main error message
   * @param {IApiError[]} [errors] - Optional array of detailed errors
   * @returns {IApiResponse<never>} Standardized error response
   * @memberof ResponseHelper
   */
  static error(message: string, errors?: IApiError[]): IApiResponse<never> {
    return {
      success: false,
      message,
      errors,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Creates an error response from a NestJS exception
   *
   * @static
   * @param {any} exception - NestJS exception object
   * @returns {IApiResponse<never>} Standardized error response
   * @memberof ResponseHelper
   */
  static fromException(exception: any): IApiResponse<never> {
    const message = exception.message || "An error occurred";
    const errors: IApiError[] = [];

    if (exception.response?.message) {
      const messages = Array.isArray(exception.response.message)
        ? exception.response.message
        : [exception.response.message];

      for (const msg of messages) {
        errors.push({ message: msg });
      }
    }

    return {
      success: false,
      message,
      errors: errors.length > 0 ? errors : undefined,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
