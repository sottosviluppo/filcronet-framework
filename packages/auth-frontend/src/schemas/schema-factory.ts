import { z } from "zod";
import {
  PasswordValidator,
  type IValidationMessages,
  type IPasswordErrorMessages,
} from "@sottosviluppo/core";

/**
 * Schema factory configuration
 *
 * @export
 * @interface SchemaFactoryConfig
 */
export interface SchemaFactoryConfig {
  messages: IValidationMessages;
  passwordMessages: IPasswordErrorMessages;
}

/**
 * Create validation schemas with custom messages
 * This is the main entry point for client applications that need i18n
 *
 * @param {SchemaFactoryConfig} config - Configuration with validation messages
 * @returns Object with all validation schema factories
 *
 * @example
 * ```typescript
 * // In your Vue app
 * import { useI18n } from 'vue-i18n';
 * import { createValidationSchemas } from '@filcronet/auth-frontend';
 * import { PasswordErrorKey } from '@filcronet/core';
 *
 * const { t } = useI18n();
 *
 * const schemas = createValidationSchemas({
 *   messages: {
 *     email: {
 *       invalid: t('validation.email.invalid'),
 *       required: t('validation.email.required'),
 *     },
 *     password: {
 *       required: t('validation.password.required'),
 *       minLength: t('validation.password.minLength'),
 *       notStrong: t('validation.password.notStrong'),
 *       containsPersonalData: t('validation.password.containsPersonalData'),
 *       mismatch: t('validation.password.mismatch'),
 *     },
 *     username: {
 *       invalid: t('validation.username.invalid'),
 *     },
 *     token: {
 *       required: t('validation.token.required'),
 *     },
 *   },
 *   passwordMessages: {
 *     [PasswordErrorKey.TooShort]: t('validation.password.tooShort'),
 *     [PasswordErrorKey.NoUppercase]: t('validation.password.noUppercase'),
 *     [PasswordErrorKey.NoLowercase]: t('validation.password.noLowercase'),
 *     [PasswordErrorKey.NoNumber]: t('validation.password.noNumber'),
 *     [PasswordErrorKey.NoSpecialChar]: t('validation.password.noSpecialChar'),
 *     [PasswordErrorKey.ContainsPersonalData]: t('validation.password.containsPersonalData'),
 *     [PasswordErrorKey.CommonPassword]: t('validation.password.commonPassword'),
 *   },
 * });
 * ```
 */
export function createValidationSchemas(config: SchemaFactoryConfig) {
  const { messages, passwordMessages } = config;

  /**
   * Password schema with custom messages
   */
  const passwordSchema = z
    .string()
    .min(12, messages.password.minLength)
    .refine((password) => PasswordValidator.isStrongPassword(password), {
      message: messages.password.notStrong,
    })
    .superRefine((password, ctx) => {
      const result = PasswordValidator.validatePassword(password);
      if (!result.isValid) {
        const errorMessages = result.errorKeys.map(
          (key) => passwordMessages[key]
        );
        ctx.addIssue({
          code: "custom",
          message: errorMessages.join("; "),
        });
      }
    });

  /**
   * Password schema with user context
   */
  const createPasswordWithContext = (userContext: {
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  }) => {
    return z
      .string()
      .min(12, messages.password.minLength)
      .superRefine((password, ctx) => {
        const result = PasswordValidator.validatePassword(
          password,
          userContext
        );
        if (!result.isValid) {
          result.errorKeys.forEach((key) => {
            ctx.addIssue({
              code: "custom",
              message: passwordMessages[key],
            });
          });
        }
      });
  };

  /**
   * Login schema
   */
  const loginSchema = z.object({
    email: z.email(messages.email.invalid),
    password: z.string().min(1, messages.password.required),
  });

  /**
   * Registration schema
   */
  const registerSchema = z
    .object({
      email: z.email(messages.email.invalid),
      username: z
        .string()
        .regex(/^[a-zA-Z0-9_-]{3,30}$/, messages.username.invalid)
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

  /**
   * Registration schema with context-aware password validation
   */
  const createRegisterWithContext = (userContext: {
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  }) => {
    return z
      .object({
        email: z.email(messages.email.invalid),
        username: z
          .string()
          .regex(/^[a-zA-Z0-9_-]{3,30}$/, messages.username.invalid)
          .optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        password: createPasswordWithContext(userContext),
        confirmPassword: z.string(),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: messages.password.mismatch,
        path: ["confirmPassword"],
      });
  };

  /**
   * Reset password schema
   */
  const resetPasswordSchema = z
    .object({
      token: z.string().min(1, messages.token.required),
      newPassword: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: messages.password.mismatch,
      path: ["confirmPassword"],
    });

  /**
   * Set password schema (invitation)
   */
  const setPasswordSchema = z
    .object({
      token: z.string().min(1, messages.token.required),
      password: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.password.mismatch,
      path: ["confirmPassword"],
    });

  /**
   * Forgot password schema
   */
  const forgotPasswordSchema = z.object({
    email: z.email(messages.email.invalid),
  });

  return {
    passwordSchema,
    createPasswordWithContext,
    loginSchema,
    registerSchema,
    createRegisterWithContext,
    resetPasswordSchema,
    setPasswordSchema,
    forgotPasswordSchema,
  };
}
