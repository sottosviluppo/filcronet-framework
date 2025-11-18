/**
 * Password validation error keys
 * Used to map PasswordValidator errors to client messages
 *
 * @export
 * @enum {string}
 */
export enum PasswordErrorKey {
  TooShort = "tooShort",
  NoUppercase = "noUppercase",
  NoLowercase = "noLowercase",
  NoNumber = "noNumber",
  NoSpecialChar = "noSpecialChar",
  ContainsPersonalData = "containsPersonalData",
  CommonPassword = "commonPassword",
}

/**
 * Validation message provider interface
 * Each client application implements this with their own translations
 *
 * @export
 * @interface IValidationMessages
 */
export interface IValidationMessages {
  email: {
    invalid: string;
    required: string;
  };
  password: {
    required: string;
    minLength: string;
    notStrong: string;
    containsPersonalData: string;
    mismatch: string;
  };
  username: {
    invalid: string;
  };
  token: {
    required: string;
  };
}

/**
 * Password error messages map
 * Maps error keys to translated messages
 *
 * @export
 * @interface IPasswordErrorMessages
 */
export interface IPasswordErrorMessages {
  [PasswordErrorKey.TooShort]: string;
  [PasswordErrorKey.NoUppercase]: string;
  [PasswordErrorKey.NoLowercase]: string;
  [PasswordErrorKey.NoNumber]: string;
  [PasswordErrorKey.NoSpecialChar]: string;
  [PasswordErrorKey.ContainsPersonalData]: string;
  [PasswordErrorKey.CommonPassword]: string;
}
