import { computed } from "vue";
import {
  createValidationSchemas,
  SchemaFactoryConfig,
} from "../../schemas/schema-factory";

/**
 * Composable for validation schemas with reactive i18n message updates
 *
 * **REQUIRED**: You must provide i18n translations for all validation messages.
 *
 * @param {() => SchemaFactoryConfig} getMessages - Function that returns current validation messages
 * @returns Validation schemas that update automatically when locale changes
 *
 * @example
 * ```vue
 * <script setup>
 * import { useI18n } from 'vue-i18n';
 * import { useAuthValidation } from '@filcronet/auth-frontend';
 * import { PasswordErrorKey } from '@filcronet/core';
 *
 * const { t } = useI18n();
 *
 * const { loginSchema, registerSchema } = useAuthValidation(() => ({
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
 * </script>
 * ```
 */
export function useAuthValidation(getMessages: () => SchemaFactoryConfig) {
  const schemas = computed(() => createValidationSchemas(getMessages()));

  return {
    ...schemas.value,
  };
}
