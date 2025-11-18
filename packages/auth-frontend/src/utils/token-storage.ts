/**
 * Token storage utility
 * Handles secure storage and retrieval of authentication tokens
 *
 * @export
 * @class TokenStorage
 */
export class TokenStorage {
  private storage: Storage;
  private readonly TOKEN_KEY = "filcronet_auth_token";
  private readonly USER_KEY = "filcronet_auth_user";

  /**
   * Creates an instance of TokenStorage
   *
   * @param {('localStorage' | 'sessionStorage')} [storageType='localStorage']
   * @memberof TokenStorage
   */
  constructor(storageType: "localStorage" | "sessionStorage" = "localStorage") {
    this.storage =
      storageType === "localStorage" ? localStorage : sessionStorage;
  }

  /**
   * Saves authentication token
   *
   * @param {string} token - JWT access token
   * @memberof TokenStorage
   */
  setToken(token: string): void {
    this.storage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Retrieves authentication token
   *
   * @returns {(string | null)} JWT token or null if not found
   * @memberof TokenStorage
   */
  getToken(): string | null {
    return this.storage.getItem(this.TOKEN_KEY);
  }

  /**
   * Removes authentication token
   *
   * @memberof TokenStorage
   */
  removeToken(): void {
    this.storage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Saves user data
   *
   * @param {any} user - User object
   * @memberof TokenStorage
   */
  setUser(user: any): void {
    this.storage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Retrieves user data
   *
   * @returns {(any | null)} User object or null if not found
   * @memberof TokenStorage
   */
  getUser(): any | null {
    const userData = this.storage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Removes user data
   *
   * @memberof TokenStorage
   */
  removeUser(): void {
    this.storage.removeItem(this.USER_KEY);
  }

  /**
   * Clears all authentication data
   *
   * @memberof TokenStorage
   */
  clear(): void {
    this.removeToken();
    this.removeUser();
  }
}
