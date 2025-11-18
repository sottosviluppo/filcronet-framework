/**
 * User account status enumeration
 * Defines possible states for user accounts
 *
 * @export
 * @enum {string}
 */
export enum UserStatus {
  /**
   * User account is active and can access the system
   */
  ACTIVE = "active",

  /**
   * User account is inactive (disabled by admin or user)
   */
  INACTIVE = "inactive",

  /**
   * User account is suspended (temporary restriction)
   */
  SUSPENDED = "suspended",

  /**
   * User has registered but not verified email yet
   */
  PENDING_VERIFICATION = "pending_verification",
}
