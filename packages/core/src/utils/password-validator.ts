import { PasswordErrorKey } from "../interfaces";

/**
 * Password validation result with error keys (not messages)
 *
 * @export
 * @interface PasswordValidationResult
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errorKeys: PasswordErrorKey[];
}

/**
 * GDPR-compliant password validation utilities
 * Based on ENISA guidelines and NIST SP 800-63B
 *
 * @export
 * @class PasswordValidator
 */
export class PasswordValidator {
  /**
   * Minimum password length (GDPR/ENISA recommendation: 12+)
   */
  private static readonly MIN_LENGTH = 12;

  /**
   * Validates password strength according to GDPR/ENISA guidelines
   *
   * @static
   * @param {string} password - Password to validate
   * @returns {boolean} True if password meets all requirements
   * @memberof PasswordValidator
   *
   * @example
   * ```typescript
   * PasswordValidator.isStrongPassword('MySecureP@ss2024') // true
   * PasswordValidator.isStrongPassword('weak') // false
   * ```
   */
  static isStrongPassword(password: string): boolean {
    const result = this.validatePassword(password);
    return result.isValid;
  }

  /**
   * Validate password strength and return error keys
   * Client app maps keys to translated messages
   *
   * @static
   * @param {string} password - Password to validate
   * @param {Object} [userContext] - Optional user context for personal data check
   * @param {string} [userContext.email] - User email
   * @param {string} [userContext.username] - Username
   * @param {string} [userContext.firstName] - First name
   * @param {string} [userContext.lastName] - Last name
   * @returns {PasswordValidationResult} Validation result with error keys
   * @memberof PasswordValidator
   *
   * @example
   * ```typescript
   * const result = PasswordValidator.validatePassword('weak', {
   *   email: 'user@example.com'
   * });
   *
   * if (!result.isValid) {
   *   // Map keys to your translations
   *   const messages = result.errorKeys.map(key => t(`validation.password.${key}`));
   * }
   * ```
   */
  static validatePassword(
    password: string,
    userContext?: {
      email?: string;
      username?: string;
      firstName?: string;
      lastName?: string;
    }
  ): PasswordValidationResult {
    const errorKeys: PasswordErrorKey[] = [];

    // Length check
    if (password.length < this.MIN_LENGTH) {
      errorKeys.push(PasswordErrorKey.TooShort);
    }

    // Character type requirements (at least 3 out of 4)
    let complexity = 0;
    if (/[A-Z]/.test(password)) complexity++;
    if (/[a-z]/.test(password)) complexity++;
    if (/[0-9]/.test(password)) complexity++;
    if (/[^A-Za-z0-9]/.test(password)) complexity++; // Special characters

    if (complexity < 3) {
      // Map missing character types to specific error keys
      if (!/[A-Z]/.test(password)) {
        errorKeys.push(PasswordErrorKey.NoUppercase);
      }
      if (!/[a-z]/.test(password)) {
        errorKeys.push(PasswordErrorKey.NoLowercase);
      }
      if (!/[0-9]/.test(password)) {
        errorKeys.push(PasswordErrorKey.NoNumber);
      }
      if (!/[^A-Za-z0-9]/.test(password)) {
        errorKeys.push(PasswordErrorKey.NoSpecialChar);
      }
    }

    // Check for sequential characters (123, abc, qwerty)
    if (this.hasSequentialCharacters(password)) {
      errorKeys.push(PasswordErrorKey.CommonPassword);
    }

    // Check for repeated characters (aaa, 111)
    if (this.hasRepeatedCharacters(password)) {
      errorKeys.push(PasswordErrorKey.CommonPassword);
    }

    // GDPR: Check if password contains personal data
    if (userContext && this.containsPersonalData(password, userContext)) {
      errorKeys.push(PasswordErrorKey.ContainsPersonalData);
    }

    return {
      isValid: errorKeys.length === 0,
      errorKeys,
    };
  }

  /**
   * Returns detailed validation errors
   *
   * @deprecated Use validatePassword() for better i18n support
   * This method is kept for backward compatibility
   *
   * @static
   * @param {string} password - Password to validate
   * @param {Object} [userContext] - Optional user context for additional checks
   * @param {string} [userContext.email] - User email
   * @param {string} [userContext.username] - Username
   * @param {string} [userContext.firstName] - First name
   * @param {string} [userContext.lastName] - Last name
   * @returns {string[]} Array of error messages
   * @memberof PasswordValidator
   *
   * @example
   * ```typescript
   * const errors = PasswordValidator.getPasswordErrors('weak123', {
   *   email: 'user@example.com',
   *   username: 'user123'
   * });
   * // ['Minimum 12 characters required', ...]
   * ```
   */
  static getPasswordErrors(
    password: string,
    userContext?: {
      email?: string;
      username?: string;
      firstName?: string;
      lastName?: string;
    }
  ): string[] {
    const errors: string[] = [];

    // Length check
    if (password.length < this.MIN_LENGTH) {
      errors.push(`Minimum ${this.MIN_LENGTH} characters required`);
    }

    // Character type requirements (at least 3 out of 4)
    let complexity = 0;
    if (/[A-Z]/.test(password)) complexity++;
    if (/[a-z]/.test(password)) complexity++;
    if (/[0-9]/.test(password)) complexity++;
    if (/[^A-Za-z0-9]/.test(password)) complexity++; // Special characters

    if (complexity < 3) {
      errors.push(
        "Must contain at least 3 of: uppercase, lowercase, number, special character"
      );
    }

    // Check for sequential characters (123, abc, qwerty)
    if (this.hasSequentialCharacters(password)) {
      errors.push("Avoid sequential characters (e.g., 123, abc)");
    }

    // Check for repeated characters (aaa, 111)
    if (this.hasRepeatedCharacters(password)) {
      errors.push("Avoid repeated characters (e.g., aaa, 111)");
    }

    // GDPR: Check if password contains personal data
    if (userContext) {
      if (this.containsPersonalData(password, userContext)) {
        errors.push(
          "Password should not contain personal information (name, email, username)"
        );
      }
    }

    return errors;
  }

  /**
   * Calculates password strength score (0-4)
   *
   * @static
   * @param {string} password - Password to evaluate
   * @returns {number} Strength score: 0 (very weak) to 4 (very strong)
   * @memberof PasswordValidator
   *
   * @example
   * ```typescript
   * PasswordValidator.getPasswordStrength('weak') // 0
   * PasswordValidator.getPasswordStrength('MySecureP@ss2024') // 4
   * ```
   */
  static getPasswordStrength(password: string): number {
    let score = 0;

    // Length scoring
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;

    // Complexity scoring
    let complexity = 0;
    if (/[A-Z]/.test(password)) complexity++;
    if (/[a-z]/.test(password)) complexity++;
    if (/[0-9]/.test(password)) complexity++;
    if (/[^A-Za-z0-9]/.test(password)) complexity++;

    if (complexity >= 3) score++;
    if (complexity === 4) score++;

    return score;
  }

  /**
   * Returns user-friendly strength label
   *
   * @static
   * @param {number} score - Strength score from getPasswordStrength()
   * @returns {string} Strength label
   * @memberof PasswordValidator
   */
  static getStrengthLabel(score: number): string {
    switch (score) {
      case 0:
        return "Very Weak";
      case 1:
        return "Weak";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Strong";
      default:
        return "Unknown";
    }
  }

  /**
   * Checks if password contains sequential characters
   *
   * @private
   * @static
   * @param {string} password - Password to check
   * @returns {boolean}
   * @memberof PasswordValidator
   */
  private static hasSequentialCharacters(password: string): boolean {
    const sequences = [
      "0123456789",
      "abcdefghijklmnopqrstuvwxyz",
      "qwertyuiop",
      "asdfghjkl",
      "zxcvbnm",
    ];

    const lowerPassword = password.toLowerCase();

    for (const seq of sequences) {
      // Check forward and backward sequences of length 3+
      for (let i = 0; i <= seq.length - 3; i++) {
        const forward = seq.substring(i, i + 3);
        const backward = forward.split("").reverse().join("");

        if (
          lowerPassword.includes(forward) ||
          lowerPassword.includes(backward)
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Checks if password has repeated characters (aaa, 111)
   *
   * @private
   * @static
   * @param {string} password - Password to check
   * @returns {boolean}
   * @memberof PasswordValidator
   */
  private static hasRepeatedCharacters(password: string): boolean {
    return /(.)\1{2,}/.test(password);
  }

  /**
   * Checks if password contains personal data (GDPR compliance)
   *
   * @private
   * @static
   * @param {string} password - Password to check
   * @param {Object} userContext - User personal data
   * @returns {boolean}
   * @memberof PasswordValidator
   */
  private static containsPersonalData(
    password: string,
    userContext: {
      email?: string;
      username?: string;
      firstName?: string;
      lastName?: string;
    }
  ): boolean {
    const lowerPassword = password.toLowerCase();

    // Check email (without domain)
    if (userContext.email) {
      const emailLocal = userContext.email.split("@")[0].toLowerCase();
      if (emailLocal.length >= 3 && lowerPassword.includes(emailLocal)) {
        return true;
      }
    }

    // Check username
    if (userContext.username && userContext.username.length >= 3) {
      if (lowerPassword.includes(userContext.username.toLowerCase())) {
        return true;
      }
    }

    // Check first name
    if (userContext.firstName && userContext.firstName.length >= 3) {
      if (lowerPassword.includes(userContext.firstName.toLowerCase())) {
        return true;
      }
    }

    // Check last name
    if (userContext.lastName && userContext.lastName.length >= 3) {
      if (lowerPassword.includes(userContext.lastName.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  /**
   * Suggests a strong password (for testing/example purposes)
   *
   * @static
   * @returns {string} Random strong password
   * @memberof PasswordValidator
   */
  static generateStrongPassword(): string {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    const all = uppercase + lowercase + numbers + special;
    let password = "";

    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest randomly (total 16 characters)
    for (let i = 4; i < 16; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle the password
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  }
}
