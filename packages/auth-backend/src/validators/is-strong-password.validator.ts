import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { PasswordValidator } from "@sottosviluppo/core";
import { mapPasswordErrorKeys } from "../utils/password-error-messages";

/**
 * Custom validator for GDPR-compliant password
 * Uses PasswordValidator.validatePassword() with error keys for i18n support
 *
 * @export
 * @class IsStrongPasswordConstraint
 * @implements {ValidatorConstraintInterface}
 */
@ValidatorConstraint({ name: "isStrongPassword", async: false })
export class IsStrongPasswordConstraint
  implements ValidatorConstraintInterface
{
  /**
   * Validates password strength with user context
   *
   * @param {string} password - Password to validate
   * @param {ValidationArguments} args - Validation arguments containing DTO object
   * @returns {boolean} True if password is valid
   * @memberof IsStrongPasswordConstraint
   */
  validate(password: string, args: ValidationArguments): boolean {
    const object = args.object as any;

    const validationResult = PasswordValidator.validatePassword(password, {
      email: object.email,
      username: object.username,
      firstName: object.firstName,
      lastName: object.lastName,
    });

    return validationResult.isValid;
  }

  /**
   * Returns error message when validation fails
   * Maps error keys to human-readable messages
   *
   * @param {ValidationArguments} args - Validation arguments
   * @returns {string} Formatted error message
   * @memberof IsStrongPasswordConstraint
   */
  defaultMessage(args: ValidationArguments): string {
    const object = args.object as any;

    const validationResult = PasswordValidator.validatePassword(
      object.password,
      {
        email: object.email,
        username: object.username,
        firstName: object.firstName,
        lastName: object.lastName,
      }
    );

    // Map error keys to messages
    const errorMessages = mapPasswordErrorKeys(validationResult.errorKeys);
    return errorMessages.join("; ");
  }
}
