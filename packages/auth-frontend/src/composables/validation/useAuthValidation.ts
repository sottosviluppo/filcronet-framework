import {
  createLoginSchema,
  createRegisterSchema,
  createResetPasswordSchema,
  createForgotPasswordSchema,
  type ILoginMessages,
  type IRegisterMessages,
  type IPasswordResetMessages,
  type IForgotPasswordMessages,
} from "../../schemas/schema-factory";
import type { IPasswordErrorMessages } from "@sottosviluppo/core";

/**
 * Create login validation schema
 */
export function useLoginValidation(messages: ILoginMessages) {
  return createLoginSchema(messages);
}

/**
 * Create register validation schema
 */
export function useRegisterValidation(
  messages: IRegisterMessages,
  passwordMessages: IPasswordErrorMessages
) {
  return createRegisterSchema(messages, passwordMessages);
}

/**
 * Create reset password validation schema
 */
export function useResetPasswordValidation(
  messages: IPasswordResetMessages,
  passwordMessages: IPasswordErrorMessages
) {
  return createResetPasswordSchema(messages, passwordMessages);
}

/**
 * Create forgot password validation schema
 */
export function useForgotPasswordValidation(messages: IForgotPasswordMessages) {
  return createForgotPasswordSchema(messages);
}
