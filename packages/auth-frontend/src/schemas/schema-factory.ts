import { z } from "zod";
import {
  PasswordValidator,
  type IPasswordErrorMessages,
} from "@sottosviluppo/core";

/**
 * Validation messages for login schema
 *
 * @export
 * @interface ILoginMessages
 *
 * @example
 * ```typescript
 * const messages: ILoginMessages = {
 *   email: {
 *     invalid: t('validation.email.invalid'),
 *     required: t('validation.email.required'),
 *   },
 *   password: {
 *     required: t('validation.password.required'),
 *   },
 * };
 * ```
 */
export interface ILoginMessages {
  /** Email field validation messages */
  email: {
    /** Message for invalid email format */
    invalid: string;
    /** Message when email is empty */
    required: string;
  };
  /** Password field validation messages */
  password: {
    /** Message when password is empty */
    required: string;
  };
}

/**
 * Validation messages for registration schema
 *
 * @export
 * @interface IRegisterMessages
 *
 * @example
 * ```typescript
 * const messages: IRegisterMessages = {
 *   email: {
 *     invalid: t('validation.email.invalid'),
 *   },
 *   password: {
 *     minLength: t('validation.password.minLength'),
 *     notStrong: t('validation.password.notStrong'),
 *     mismatch: t('validation.password.mismatch'),
 *   },
 *   username: {
 *     invalid: t('validation.username.invalid'),
 *   },
 * };
 * ```
 */
export interface IRegisterMessages {
  /** Email field validation messages */
  email: {
    /** Message for invalid email format */
    invalid: string;
  };
  /** Password field validation messages */
  password: {
    /** Message when password is too short */
    minLength: string;
    /** Message when password doesn't meet strength requirements */
    notStrong: string;
    /** Message when passwords don't match */
    mismatch: string;
  };
  /** Username field validation messages (optional) */
  username?: {
    /** Message for invalid username format */
    invalid: string;
  };
}

/**
 * Validation messages for password reset schema
 *
 * @export
 * @interface IPasswordResetMessages
 *
 * @example
 * ```typescript
 * const messages: IPasswordResetMessages = {
 *   token: {
 *     required: t('validation.token.required'),
 *   },
 *   password: {
 *     minLength: t('validation.password.minLength'),
 *     notStrong: t('validation.password.notStrong'),
 *     mismatch: t('validation.password.mismatch'),
 *   },
 * };
 * ```
 */
export interface IPasswordResetMessages {
  /** Token field validation messages */
  token: {
    /** Message when token is empty */
    required: string;
  };
  /** Password field validation messages */
  password: {
    /** Message when password is too short */
    minLength: string;
    /** Message when password doesn't meet strength requirements */
    notStrong: string;
    /** Message when passwords don't match */
    mismatch: string;
  };
}

/**
 * Validation messages for forgot password schema
 *
 * @export
 * @interface IForgotPasswordMessages
 *
 * @example
 * ```typescript
 * const messages: IForgotPasswordMessages = {
 *   email: {
 *     required: t('validation.email.required'),
 *     invalid: t('validation.email.invalid'),
 *   },
 * };
 * ```
 */
export interface IForgotPasswordMessages {
  /** Email field validation messages */
  email: {
    /** Message when email is empty */
    required: string;
    /** Message for invalid email format */
    invalid: string;
  };
}

/**
 * Validation messages for set password schema (invitation flow)
 *
 * @export
 * @interface ISetPasswordMessages
 *
 * @example
 * ```typescript
 * const messages: ISetPasswordMessages = {
 *   token: {
 *     required: t('validation.token.required'),
 *   },
 *   password: {
 *     minLength: t('validation.password.minLength'),
 *     notStrong: t('validation.password.notStrong'),
 *     mismatch: t('validation.password.mismatch'),
 *   },
 * };
 * ```
 */
export interface ISetPasswordMessages {
  /** Token field validation messages */
  token: {
    /** Message when token is empty */
    required: string;
  };
  /** Password field validation messages */
  password: {
    /** Message when password is too short */
    minLength: string;
    /** Message when password doesn't meet strength requirements */
    notStrong: string;
    /** Message when passwords don't match */
    mismatch: string;
  };
}

/**
 * Creates a Zod validation schema for login form
 *
 * @export
 * @param {ILoginMessages} messages - Localized validation messages
 * @returns {z.ZodObject} Zod schema for login validation
 *
 * @example
 * ```typescript
 * import { useI18n } from 'vue-i18n';
 * import { createLoginSchema } from '@sottosviluppo/auth-frontend';
 *
 * const { t } = useI18n();
 *
 * const loginSchema = createLoginSchema({
 *   email: {
 *     invalid: t('validation.email.invalid'),
 *     required: t('validation.email.required'),
 *   },
 *   password: {
 *     required: t('validation.password.required'),
 *   },
 * });
 *
 * // Use with vee-validate or manual validation
 * const result = loginSchema.safeParse(formData);
 * if (!result.success) {
 *   console.log(result.error.flatten());
 * }
 * ```
 */
export function createLoginSchema(messages: ILoginMessages) {
  return z.object({
    email: z
      .string()
      .min(1, messages.email.required)
      .email(messages.email.invalid),
    password: z.string().min(1, messages.password.required),
  });
}

/**
 * Creates a Zod validation schema for registration form
 *
 * Includes GDPR-compliant password validation using PasswordValidator
 * from @sottosviluppo/core. Password must meet strength requirements
 * and cannot contain personal data.
 *
 * @export
 * @param {IRegisterMessages} messages - Localized validation messages
 * @param {IPasswordErrorMessages} passwordMessages - Localized password error messages
 * @returns {z.ZodEffects} Zod schema with refinement for password confirmation
 *
 * @example
 * ```typescript
 * import { useI18n } from 'vue-i18n';
 * import { createRegisterSchema } from '@sottosviluppo/auth-frontend';
 * import { PasswordErrorKey } from '@sottosviluppo/core';
 *
 * const { t } = useI18n();
 *
 * const registerSchema = createRegisterSchema(
 *   {
 *     email: { invalid: t('validation.email.invalid') },
 *     password: {
 *       minLength: t('validation.password.minLength'),
 *       notStrong: t('validation.password.notStrong'),
 *       mismatch: t('validation.password.mismatch'),
 *     },
 *     username: { invalid: t('validation.username.invalid') },
 *   },
 *   {
 *     [PasswordErrorKey.TooShort]: t('password.tooShort'),
 *     [PasswordErrorKey.NoUppercase]: t('password.noUppercase'),
 *     [PasswordErrorKey.NoLowercase]: t('password.noLowercase'),
 *     [PasswordErrorKey.NoNumber]: t('password.noNumber'),
 *     [PasswordErrorKey.NoSpecialChar]: t('password.noSpecialChar'),
 *     [PasswordErrorKey.ContainsPersonalData]: t('password.containsPersonalData'),
 *     [PasswordErrorKey.CommonPassword]: t('password.commonPassword'),
 *   }
 * );
 * ```
 */
export function createRegisterSchema(
  messages: IRegisterMessages,
  passwordMessages: IPasswordErrorMessages
) {
  const passwordSchema = z
    .string()
    .min(12, messages.password.minLength)
    .superRefine((password, ctx) => {
      const result = PasswordValidator.validatePassword(password);
      if (!result.isValid) {
        result.errorKeys.forEach((key) => {
          ctx.addIssue({
            code: "custom",
            message: passwordMessages[key],
          });
        });
      }
    });

  return z
    .object({
      email: z.string().email(messages.email.invalid),
      username: messages.username
        ? z
            .string()
            .regex(/^[a-zA-Z0-9_-]{3,30}$/, messages.username.invalid)
            .optional()
        : z
            .string()
            .regex(/^[a-zA-Z0-9_-]{3,30}$/)
            .optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      password: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.password.mismatch,
      path: ["confirmPassword"],
    });
}

/**
 * Creates a Zod validation schema for password reset form
 *
 * Used when user resets password via email link.
 * Includes GDPR-compliant password validation.
 *
 * @export
 * @param {IPasswordResetMessages} messages - Localized validation messages
 * @param {IPasswordErrorMessages} passwordMessages - Localized password error messages
 * @returns {z.ZodEffects} Zod schema with refinement for password confirmation
 *
 * @example
 * ```typescript
 * const resetSchema = createResetPasswordSchema(
 *   {
 *     token: { required: t('validation.token.required') },
 *     password: {
 *       minLength: t('validation.password.minLength'),
 *       notStrong: t('validation.password.notStrong'),
 *       mismatch: t('validation.password.mismatch'),
 *     },
 *   },
 *   passwordErrorMessages
 * );
 * ```
 */
export function createResetPasswordSchema(
  messages: IPasswordResetMessages,
  passwordMessages: IPasswordErrorMessages
) {
  const passwordSchema = z
    .string()
    .min(12, messages.password.minLength)
    .superRefine((password, ctx) => {
      const result = PasswordValidator.validatePassword(password);
      if (!result.isValid) {
        result.errorKeys.forEach((key) => {
          ctx.addIssue({
            code: "custom",
            message: passwordMessages[key],
          });
        });
      }
    });

  return z
    .object({
      token: z.string().min(1, messages.token.required),
      newPassword: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: messages.password.mismatch,
      path: ["confirmPassword"],
    });
}

/**
 * Creates a Zod validation schema for forgot password form
 *
 * Simple schema for email-only form to request password reset.
 *
 * @export
 * @param {IForgotPasswordMessages} messages - Localized validation messages
 * @returns {z.ZodObject} Zod schema for forgot password validation
 *
 * @example
 * ```typescript
 * const forgotSchema = createForgotPasswordSchema({
 *   email: {
 *     required: t('validation.email.required'),
 *     invalid: t('validation.email.invalid'),
 *   },
 * });
 * ```
 */
export function createForgotPasswordSchema(messages: IForgotPasswordMessages) {
  return z.object({
    email: z
      .string()
      .min(1, messages.email.required)
      .email(messages.email.invalid),
  });
}

/**
 * Creates a Zod validation schema for set password form (invitation flow)
 *
 * Used when user sets password for the first time via invitation link.
 * Includes GDPR-compliant password validation.
 *
 * @export
 * @param {ISetPasswordMessages} messages - Localized validation messages
 * @param {IPasswordErrorMessages} passwordMessages - Localized password error messages
 * @returns {z.ZodEffects} Zod schema with refinement for password confirmation
 *
 * @example
 * ```typescript
 * const setPasswordSchema = createSetPasswordSchema(
 *   {
 *     token: { required: t('validation.token.required') },
 *     password: {
 *       minLength: t('validation.password.minLength'),
 *       notStrong: t('validation.password.notStrong'),
 *       mismatch: t('validation.password.mismatch'),
 *     },
 *   },
 *   passwordErrorMessages
 * );
 *
 * // Validate form data
 * const result = setPasswordSchema.safeParse({
 *   token: route.query.token,
 *   password: formData.password,
 *   confirmPassword: formData.confirmPassword,
 * });
 * ```
 */
export function createSetPasswordSchema(
  messages: ISetPasswordMessages,
  passwordMessages: IPasswordErrorMessages
) {
  const passwordSchema = z
    .string()
    .min(12, messages.password.minLength)
    .superRefine((password, ctx) => {
      const result = PasswordValidator.validatePassword(password);
      if (!result.isValid) {
        result.errorKeys.forEach((key) => {
          ctx.addIssue({
            code: "custom",
            message: passwordMessages[key],
          });
        });
      }
    });

  return z
    .object({
      token: z.string().min(1, messages.token.required),
      password: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.password.mismatch,
      path: ["confirmPassword"],
    });
}
