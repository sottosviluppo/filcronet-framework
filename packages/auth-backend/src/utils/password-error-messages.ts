import { PasswordErrorKey } from "@sottosviluppo/core";

/**
 * Maps PasswordErrorKey enum to human-readable English messages
 * For i18n, use these keys to map to your translation system
 *
 * @export
 * @constant
 */
export const PASSWORD_ERROR_MESSAGES: Record<PasswordErrorKey, string> = {
  [PasswordErrorKey.TooShort]: "Password must be at least 12 characters long",
  [PasswordErrorKey.NoUppercase]:
    "Password must contain at least one uppercase letter",
  [PasswordErrorKey.NoLowercase]:
    "Password must contain at least one lowercase letter",
  [PasswordErrorKey.NoNumber]: "Password must contain at least one number",
  [PasswordErrorKey.NoSpecialChar]:
    "Password must contain at least one special character",
  [PasswordErrorKey.CommonPassword]:
    "Password contains common patterns (avoid sequential or repeated characters)",
  [PasswordErrorKey.ContainsPersonalData]:
    "Password should not contain personal information (name, email, username)",
};

/**
 * Helper function to map error keys to messages
 *
 * @export
 * @param {PasswordErrorKey[]} errorKeys - Array of error keys
 * @returns {string[]} Array of human-readable messages
 */
export function mapPasswordErrorKeys(errorKeys: PasswordErrorKey[]): string[] {
  return errorKeys.map((key) => PASSWORD_ERROR_MESSAGES[key]);
}
