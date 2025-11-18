import { computed } from "vue";
import {
  PasswordValidator,
  type IPasswordErrorMessages,
} from "@filcronet/core";

/**
 * Options for password strength composable
 *
 * @export
 * @interface UsePasswordStrengthOptions
 */
export interface UsePasswordStrengthOptions {
  /**
   * Custom error messages map (optional)
   * If not provided, returns error keys as strings
   */
  errorMessages?: IPasswordErrorMessages;
}

/**
 * Password strength composable
 * Provides real-time password strength feedback
 *
 * @export
 * @function usePasswordStrength
 *
 * @example
 * ```vue
 * <script setup>
 * import { usePasswordStrength } from '@filcronet/auth-frontend';
 * import { useI18n } from 'vue-i18n';
 * import { PasswordErrorKey } from '@filcronet/core';
 *
 * const { t } = useI18n();
 * const password = ref('');
 *
 * // With custom messages
 * const { strength, strengthLabel, errors } = usePasswordStrength(
 *   password,
 *   undefined,
 *   {
 *     errorMessages: {
 *       [PasswordErrorKey.TooShort]: t('validation.password.tooShort'),
 *       [PasswordErrorKey.NoUppercase]: t('validation.password.noUppercase'),
 *       [PasswordErrorKey.NoLowercase]: t('validation.password.noLowercase'),
 *       [PasswordErrorKey.NoNumber]: t('validation.password.noNumber'),
 *       [PasswordErrorKey.NoSpecialChar]: t('validation.password.noSpecialChar'),
 *       [PasswordErrorKey.ContainsPersonalData]: t('validation.password.containsPersonalData'),
 *       [PasswordErrorKey.CommonPassword]: t('validation.password.commonPassword'),
 *     }
 *   }
 * );
 *
 * // OR without custom messages (returns keys as strings)
 * const { errors: errorKeys } = usePasswordStrength(password);
 * const translatedErrors = computed(() =>
 *   errorKeys.value.map(key => t(`validation.password.${key}`))
 * );
 * </script>
 *
 * <template>
 *   <input v-model="password" type="password" />
 *   <div :style="{ color: strengthColor }">
 *     Strength: {{ strengthLabel }}
 *   </div>
 *   <ul v-if="errors.length">
 *     <li v-for="error in errors">{{ error }}</li>
 *   </ul>
 * </template>
 * ```
 */
export function usePasswordStrength(
  password: { value: string },
  userContext?: {
    email?: { value: string };
    username?: { value: string };
    firstName?: { value: string };
    lastName?: { value: string };
  },
  options?: UsePasswordStrengthOptions
) {
  const strength = computed(() => {
    if (!password.value) return 0;
    return PasswordValidator.getPasswordStrength(password.value);
  });

  const strengthLabel = computed(() => {
    return PasswordValidator.getStrengthLabel(strength.value);
  });

  const strengthColor = computed(() => {
    switch (strength.value) {
      case 0:
        return "#dc2626"; // red-600
      case 1:
        return "#ea580c"; // orange-600
      case 2:
        return "#ca8a04"; // yellow-600
      case 3:
        return "#16a34a"; // green-600
      case 4:
        return "#059669"; // emerald-600
      default:
        return "#6b7280"; // gray-500
    }
  });

  /**
   * Error keys or translated messages
   */
  const errors = computed(() => {
    if (!password.value) return [];

    const context = userContext
      ? {
          email: userContext.email?.value,
          username: userContext.username?.value,
          firstName: userContext.firstName?.value,
          lastName: userContext.lastName?.value,
        }
      : undefined;

    const result = PasswordValidator.validatePassword(password.value, context);

    // If custom messages provided, map keys to messages
    if (options?.errorMessages) {
      return result.errorKeys.map((key) => options.errorMessages![key]);
    }

    // Otherwise return keys as strings (backward compatible)
    return result.errorKeys as string[];
  });

  const isValid = computed(() => errors.value.length === 0);

  /**
   * Progress value for strength meter (0-100)
   */
  const progressValue = computed(() => (strength.value / 4) * 100);

  return {
    strength,
    strengthLabel,
    strengthColor,
    errors,
    isValid,
    progressValue,
  };
}
