import { z } from "zod";
import {
  PasswordValidator,
  type IPasswordErrorMessages,
} from "@sottosviluppo/core";

/**
 * Messages for login schema
 */
export interface ILoginMessages {
  email: {
    invalid: string;
    required: string;
  };
  password: {
    required: string;
  };
}

/**
 * Messages for registration schema
 */
export interface IRegisterMessages {
  email: {
    invalid: string;
  };
  password: {
    minLength: string;
    notStrong: string;
    mismatch: string;
  };
  username?: {
    invalid: string;
  };
}

/**
 * Messages for password reset/set schemas
 */
export interface IPasswordResetMessages {
  token: {
    required: string;
  };
  password: {
    minLength: string;
    notStrong: string;
    mismatch: string;
  };
}

/**
 * Messages for forgot password schema
 */
export interface IForgotPasswordMessages {
  email: {
    invalid: string;
  };
}

/**
 * Create login schema
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
 * Create registration schema
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
 * Create password reset schema
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
 * Create forgot password schema
 */
export function createForgotPasswordSchema(messages: IForgotPasswordMessages) {
  return z.object({
    email: z.string().email(messages.email.invalid),
  });
}
