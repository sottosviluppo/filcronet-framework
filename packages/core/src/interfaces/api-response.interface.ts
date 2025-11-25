/**
 * Standardized API response wrapper
 * All API endpoints should return data in this format for consistency
 *
 * @export
 * @interface IApiResponse
 * @template T - Type of the data payload
 */
export interface IApiResponse<T = any> {
  /**
   * Whether the operation was successful
   *
   * @type {boolean}
   */
  success: boolean;

  /**
   * Response data payload
   * Undefined if operation failed
   *
   * @type {T}
   */
  data?: T;

  /**
   * Optional success or error message
   * Human-readable description of the result
   *
   * @type {string}
   */
  message?: string;

  /**
   * Array of errors (if any occurred)
   * Provides detailed validation or processing errors
   *
   * @type {IApiError[]}
   */
  errors?: IApiError[];

  /**
   * Metadata about the response
   *
   * @type {IApiMeta}
   */
  meta?: IApiMeta;
}

/**
 * Detailed error information
 *
 * @export
 * @interface IApiError
 */
export interface IApiError {
  /**
   * Field name that caused the error (for validation errors)
   *
   * @type {string}
   */
  field?: string;

  /**
   * Error message
   *
   * @type {string}
   */
  message: string;

  /**
   * Optional error code for programmatic handling
   *
   * @type {string}
   */
  code?: string;
}

/**
 * Response metadata
 *
 * @export
 * @interface IApiMeta
 */
export interface IApiMeta {
  /**
   * ISO timestamp of when response was generated
   *
   * @type {string}
   */
  timestamp: string;

  /**
   * Unique request identifier for tracking/debugging
   *
   * @type {string}
   */
  requestId?: string;
}

/**
 * Paginated response wrapper
 * Used for list endpoints with pagination
 *
 * @export
 * @interface IPaginatedResponse
 * @template T - Type of items in the data array
 */
export interface IPaginatedResponse<T> extends IApiResponse<T[]> {
  /**
   * Pagination metadata
   *
   * @type {IPagination}
   */
  pagination: IPagination;
}

/**
 * Pagination information
 *
 * @export
 * @interface IPagination
 */
export interface IPagination {
  /**
   * Current page number (1-indexed)
   *
   * @type {number}
   */
  page: number;

  /**
   * Number of items per page
   *
   * @type {number}
   */
  limit: number;

  /**
   * Total number of items across all pages
   *
   * @type {number}
   */
  total: number;

  /**
   * Total number of pages
   *
   * @type {number}
   */
  totalPages: number;
}

/**
 * Query parameters for pagination and sorting
 *
 * @export
 * @interface IPaginationParams
 */
export interface IPaginationParams {
  /**
   * Page number to retrieve (default: 1)
   *
   * @type {number}
   */
  page?: number;

  /**
   * Number of items per page (default: 10)
   *
   * @type {number}
   */
  limit?: number;

  /**
   * Field name to sort by
   * Examples: 'createdAt', 'name', 'email'
   *
   * @type {string}
   */
  sortBy?: string;

  /**
   * Sort order (ascending or descending)
   *
   * @type {('ASC' | 'DESC')}
   */
  sortOrder?: "ASC" | "DESC";
}

/**
 * Token pair response
 *
 * @export
 * @interface ITokenPair
 */
export interface ITokenPair {
  /**
   * JWT access token (short-lived)
   *
   * @type {string}
   */
  accessToken: string;

  /**
   * JWT refresh token (long-lived)
   *
   * @type {string}
   */
  refreshToken: string;
}

/**
 * Paginated API response
 * Extends IApiResponse with pagination metadata
 *
 * @export
 * @interface IPaginatedApiResponse
 * @template T
 */
export interface IPaginatedApiResponse<T> extends IApiResponse<T[]> {
  /**
   * Pagination metadata
   *
   * @type {IPagination}
   */
  pagination: IPagination;
}
