import { getTokenExpiryTime } from "./jwt-decoder";

/**
 * Automatic token refresh scheduler
 * Schedules token refresh before expiration to prevent 401 errors
 *
 * @export
 * @class TokenRefreshScheduler
 *
 * @example
 * ```typescript
 * const scheduler = new TokenRefreshScheduler(
 *   async () => {
 *     const response = await authApi.refreshToken();
 *     return response.accessToken;
 *   },
 *   60000 // Refresh 1 minute before expiry
 * );
 *
 * // Schedule refresh when you get a new token
 * scheduler.schedule(accessToken);
 *
 * // Cancel on logout
 * scheduler.cancel();
 * ```
 */
export class TokenRefreshScheduler {
  /**
   * Current timeout ID
   *
   * @private
   * @type {(ReturnType<typeof setTimeout> | null)}
   * @memberof TokenRefreshScheduler
   */
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Creates an instance of TokenRefreshScheduler
   *
   * @param {() => Promise<string>} refreshCallback - Function to call when refresh is needed
   * @param {number} [refreshBeforeExpiry=60000] - Milliseconds before expiry to trigger refresh
   * @memberof TokenRefreshScheduler
   */
  constructor(
    private refreshCallback: () => Promise<string>,
    private refreshBeforeExpiry: number = 60000
  ) {}

  /**
   * Schedules token refresh before expiration
   * Cancels any existing scheduled refresh
   *
   * @param {string} token - JWT access token
   * @memberof TokenRefreshScheduler
   *
   * @example
   * ```typescript
   * // Token expires at: 15:30:00
   * // Current time: 15:15:00
   * // Refresh before: 60000ms (1 minute)
   * // Scheduled refresh: 14 minutes from now
   * // Refresh triggers at: 15:29:00
   *
   * scheduler.schedule(accessToken);
   * ```
   */
  schedule(token: string): void {
    // Cancel any existing scheduled refresh
    this.cancel();

    const timeUntilExpiry = getTokenExpiryTime(token);

    // If token is already expired or expires very soon, refresh immediately
    if (timeUntilExpiry <= this.refreshBeforeExpiry) {
      this.executeRefresh();
      return;
    }

    // Schedule refresh before expiry
    const refreshIn = timeUntilExpiry - this.refreshBeforeExpiry;

    this.timeoutId = setTimeout(() => {
      this.executeRefresh();
    }, refreshIn);
  }

  /**
   * Cancels any scheduled token refresh
   *
   * @memberof TokenRefreshScheduler
   */
  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Executes the refresh callback
   *
   * @private
   * @memberof TokenRefreshScheduler
   */
  private async executeRefresh(): Promise<void> {
    try {
      const newToken = await this.refreshCallback();

      // Schedule next refresh with new token
      if (newToken) {
        this.schedule(newToken);
      }
    } catch (error) {
      console.error("[TokenRefreshScheduler] Token refresh failed:", error);
      // Don't reschedule on error - let the 401 handler deal with it
    }
  }

  /**
   * Checks if a refresh is currently scheduled
   *
   * @returns {boolean} True if refresh is scheduled
   * @memberof TokenRefreshScheduler
   */
  isScheduled(): boolean {
    return this.timeoutId !== null;
  }
}
