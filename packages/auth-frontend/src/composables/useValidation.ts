import { computed } from "vue";
import { createValidationSchemas, type SchemaFactoryConfig } from "../schemas/schema-factory";

/**
 * Composable for validation schemas with reactive message updates
 * Optional - only use if you need i18n support
 *
 * @param {() => SchemaFactoryConfig} getMessages - Function that returns current validation messages
 * @returns Validation schemas that update when messages change
 *
 * @example
 * ```vue
 * <script setup>
 * import { useI18n } from 'vue-i18n';
 * import { useValidation } from '@filcronet/auth-frontend';
 * import { PasswordErrorKey } from '@filcronet/core';
 *
 * const { t } = useI18n();
 *
 * const { loginSchema, registerSchema } = useValidation(() => ({
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
 * }));
 *
 * // Schemas update automatically when locale changes
 * </script>
 * ```
 */
export function useValidation(getMessages: () => SchemaFactoryConfig) {
  const schemas = computed(() => createValidationSchemas(getMessages()));

  return {
    loginSchema: computed(() => schemas.value.loginSchema),
    registerSchema: computed(() => schemas.value.registerSchema),
    createRegisterWithContext: (userContext: any) =>
      schemas.value.createRegisterWithContext(userContext),
    resetPasswordSchema: computed(() => schemas.value.resetPasswordSchema),
    setPasswordSchema: computed(() => schemas.value.setPasswordSchema),
    forgotPasswordSchema: computed(() => schemas.value.forgotPasswordSchema),
  };
}
