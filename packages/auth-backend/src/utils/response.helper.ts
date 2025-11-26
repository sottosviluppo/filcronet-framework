import { IApiResponse, IApiError } from "@sottosviluppo/core";

/**
 * Helper class for creating standardized API responses
 *
 * All API endpoints should use these methods to ensure consistent
 * response format across the application.
 *
 * @export
 * @class ResponseHelper
 *
 * @example
 * ```typescript
 * // Success with data
 * return ResponseHelper.success(user, 'User created successfully');
 *
 * // Success without data
 * return ResponseHelper.successMessage('Email sent successfully');
 *
 * // Error response
 * return ResponseHelper.error('Validation failed', [
 *   { field: 'email', message: 'Invalid email format' }
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
   *
   * @example
   * ```typescript
   * // Return user data
   * return ResponseHelper.success(user);
   *
   * // Return with message
   * return ResponseHelper.success(user, 'User fetched successfully');
   *
   * // Return array
   * return ResponseHelper.success(users, 'Found 10 users');
   * ```
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
   * Use for operations that don't return data, like delete or send email.
   *
   * @static
   * @param {string} message - Success message
   * @returns {IApiResponse<void>} Standardized success response
   * @memberof ResponseHelper
   *
   * @example
   * ```typescript
   * // After deletion
   * return ResponseHelper.successMessage('User deleted successfully');
   *
   * // After sending email
   * return ResponseHelper.successMessage('Password reset email sent');
   * ```
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
   *
   * @example
   * ```typescript
   * // Simple error
   * return ResponseHelper.error('User not found');
   *
   * // With validation errors
   * return ResponseHelper.error('Validation failed', [
   *   { field: 'email', message: 'Email is required' },
   *   { field: 'password', message: 'Password too short' },
   * ]);
   *
   * // With error codes
   * return ResponseHelper.error('Authentication failed', [
   *   { message: 'Invalid credentials', code: 'AUTH_INVALID_CREDENTIALS' },
   * ]);
   * ```
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
   * Automatically extracts message and validation errors from
   * NestJS HttpException and ValidationPipe errors.
   *
   * @static
   * @param {any} exception - NestJS exception object
   * @returns {IApiResponse<never>} Standardized error response
   * @memberof ResponseHelper
   *
   * @example
   * ```typescript
   * // In exception filter
   * catch(exception: HttpException, host: ArgumentsHost) {
   *   const response = ResponseHelper.fromException(exception);
   *   // response.errors will contain validation messages if present
   * }
   * ```
   */
  static fromException(exception: any): IApiResponse<never> {
    const message = exception.message || "An error occurred";
    const errors: IApiError[] = [];

    // Parse validation errors from class-validator
    if (exception.response?.message) {
      const messages = Array.isArray(exception.response.message)
        ? exception.response.message
        : [exception.response.message];

      messages.forEach((msg: string) => {
        errors.push({ message: msg });
      });
    }

    return ResponseHelper.error(
      message,
      errors.length > 0 ? errors : undefined
    );
  }
}
