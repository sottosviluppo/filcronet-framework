import {
  createLoginSchema,
  createRegisterSchema,
  createResetPasswordSchema,
  createForgotPasswordSchema,
  createSetPasswordSchema,
  type ILoginMessages,
  type IRegisterMessages,
  type IPasswordResetMessages,
  type IForgotPasswordMessages,
  type ISetPasswordMessages,
} from "../../schemas/schema-factory";
import type { IPasswordErrorMessages } from "@sottosviluppo/core";

/**
 * Creates a Zod validation schema for login form
 *
 * Convenience composable that wraps createLoginSchema for use in Vue components.
 * Provides i18n-ready validation with customizable messages.
 *
 * @export
 * @param {ILoginMessages} messages - Localized validation messages
 * @returns {z.ZodObject} Zod schema for login validation
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useLoginValidation } from '@sottosviluppo/auth-frontend';
 * import { useI18n } from 'vue-i18n';
 * import { useForm } from 'vee-validate';
 * import { toTypedSchema } from '@vee-validate/zod';
 *
 * const { t } = useI18n();
 *
 * const loginSchema = useLoginValidation({
 *   email: {
 *     invalid: t('validation.email.invalid'),
 *     required: t('validation.email.required'),
 *   },
 *   password: {
 *     required: t('validation.password.required'),
 *   },
 * });
 *
 * const { handleSubmit, errors } = useForm({
 *   validationSchema: toTypedSchema(loginSchema),
 * });
 * </script>
 * ```
 */
export function useLoginValidation(messages: ILoginMessages) {
  return createLoginSchema(messages);
}

/**
 * Creates a Zod validation schema for registration form
 *
 * Includes GDPR-compliant password validation with customizable error messages.
 * Password is validated against strength requirements and cannot contain personal data.
 *
 * @export
 * @param {IRegisterMessages} messages - Localized validation messages
 * @param {IPasswordErrorMessages} passwordMessages - Localized password strength error messages
 * @returns {z.ZodEffects} Zod schema with password confirmation refinement
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useRegisterValidation } from '@sottosviluppo/auth-frontend';
 * import { PasswordErrorKey } from '@sottosviluppo/core';
 * import { useI18n } from 'vue-i18n';
 *
 * const { t } = useI18n();
 *
 * const registerSchema = useRegisterValidation(
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
 * </script>
 * ```
 */
export function useRegisterValidation(
  messages: IRegisterMessages,
  passwordMessages: IPasswordErrorMessages
) {
  return createRegisterSchema(messages, passwordMessages);
}

/**
 * Creates a Zod validation schema for password reset form
 *
 * Used when user resets password via email link.
 * Includes GDPR-compliant password validation.
 *
 * @export
 * @param {IPasswordResetMessages} messages - Localized validation messages
 * @param {IPasswordErrorMessages} passwordMessages - Localized password strength error messages
 * @returns {z.ZodEffects} Zod schema with password confirmation refinement
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useResetPasswordValidation } from '@sottosviluppo/auth-frontend';
 * import { useI18n } from 'vue-i18n';
 *
 * const { t } = useI18n();
 *
 * const resetSchema = useResetPasswordValidation(
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
 * </script>
 * ```
 */
export function useResetPasswordValidation(
  messages: IPasswordResetMessages,
  passwordMessages: IPasswordErrorMessages
) {
  return createResetPasswordSchema(messages, passwordMessages);
}

/**
 * Creates a Zod validation schema for forgot password form
 *
 * Simple email-only validation for requesting password reset.
 *
 * @export
 * @param {IForgotPasswordMessages} messages - Localized validation messages
 * @returns {z.ZodObject} Zod schema for forgot password validation
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useForgotPasswordValidation } from '@sottosviluppo/auth-frontend';
 * import { useI18n } from 'vue-i18n';
 *
 * const { t } = useI18n();
 *
 * const forgotSchema = useForgotPasswordValidation({
 *   email: {
 *     required: t('validation.email.required'),
 *     invalid: t('validation.email.invalid'),
 *   },
 * });
 * </script>
 * ```
 */
export function useForgotPasswordValidation(messages: IForgotPasswordMessages) {
  return createForgotPasswordSchema(messages);
}

/**
 * Creates a Zod validation schema for set password form (invitation flow)
 *
 * Used when user sets password for the first time via invitation link.
 * Includes GDPR-compliant password validation.
 *
 * @export
 * @param {ISetPasswordMessages} messages - Localized validation messages
 * @param {IPasswordErrorMessages} passwordMessages - Localized password strength error messages
 * @returns {z.ZodEffects} Zod schema with password confirmation refinement
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useSetPasswordValidation } from '@sottosviluppo/auth-frontend';
 * import { useI18n } from 'vue-i18n';
 *
 * const { t } = useI18n();
 *
 * const setPasswordSchema = useSetPasswordValidation(
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
 * </script>
 * ```
 */
export function useSetPasswordValidation(
  messages: ISetPasswordMessages,
  passwordMessages: IPasswordErrorMessages
) {
  return createSetPasswordSchema(messages, passwordMessages);
}
