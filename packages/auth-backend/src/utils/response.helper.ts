import { IApiResponse, IApiError } from "@sottosviluppo/core";

/**
 * Helper per creare risposte API standardizzate
 *
 * @export
 * @class ResponseHelper
 */
export class ResponseHelper {
  /**
   * Crea una risposta di successo
   *
   * @static
   * @template T
   * @param {T} data - Dati da ritornare
   * @param {string} [message] - Messaggio opzionale
   * @returns {IApiResponse<T>}
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
   * Crea una risposta di successo senza dati
   *
   * @static
   * @param {string} message - Messaggio
   * @returns {IApiResponse<void>}
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
   * Crea una risposta di errore
   *
   * @static
   * @param {string} message - Messaggio errore
   * @param {IApiError[]} [errors] - Dettagli errori
   * @returns {IApiResponse<never>}
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
   * Crea risposta da Exception
   *
   * @static
   * @param {any} exception - NestJS Exception
   * @returns {IApiResponse<never>}
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
