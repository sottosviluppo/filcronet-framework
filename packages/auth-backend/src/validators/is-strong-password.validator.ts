import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";
import { PasswordValidator } from "@sottosviluppo/core";

/**
 * Custom validator for GDPR-compliant password
 */
@ValidatorConstraint({ name: "isStrongPassword", async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    const object = args.object as any;

    const errors = PasswordValidator.getPasswordErrors(password, {
      email: object.email,
      username: object.username,
      firstName: object.firstName,
      lastName: object.lastName,
    });

    return errors.length === 0;
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as any;
    const errors = PasswordValidator.getPasswordErrors(object.password, {
      email: object.email,
      username: object.username,
      firstName: object.firstName,
      lastName: object.lastName,
    });

    return errors.join("; ");
  }
}
