import { IPasswordErrorMessages, PasswordValidator } from "@sottosviluppo/core";
import { computed, toValue, type MaybeRefOrGetter } from "vue";

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
 * User context for password validation (can be refs or plain values)
 */
export interface PasswordUserContext {
  email?: MaybeRefOrGetter<string | undefined>;
  username?: MaybeRefOrGetter<string | undefined>;
  firstName?: MaybeRefOrGetter<string | undefined>;
  lastName?: MaybeRefOrGetter<string | undefined>;
}

/**
 * Password strength composable
 * Provides real-time password strength feedback
 *
 * @export
 * @function usePasswordStrength
 * @param {MaybeRefOrGetter<string>} password - Password value (ref, computed, getter, or plain string)
 * @param {PasswordUserContext} [userContext] - User context for personal data validation
 * @param {UsePasswordStrengthOptions} [options] - Configuration options
 * @returns Password strength indicators and validation errors
 *
 * @example
 * ```vue
 * <script setup>
 * import { ref } from 'vue';
 * import { usePasswordStrength } from '@sottosviluppo/auth-frontend';
 * import { useI18n } from 'vue-i18n';
 * import { PasswordErrorKey } from '@sottosviluppo/core';
 *
 * const { t } = useI18n();
 * const password = ref('');
 * const email = ref('user@example.com');
 *
 * // Passa direttamente i refs - nessun wrapping necessario!
 * const { strength, strengthLabel, errors, strengthColor } = usePasswordStrength(
 *   password,
 *   { email }, // refs o valori plain - funziona con entrambi
 *   {
 *     errorMessages: {
 *       [PasswordErrorKey.TooShort]: t('validation.password.tooShort'),
 *       [PasswordErrorKey.NoUppercase]: t('validation.password.noUppercase'),
 *       // ... altri messaggi
 *     }
 *   }
 * );
 * </script>
 *
 * <template>
 *   <input v-model="password" type="password" />
 *   <div :style="{ color: strengthColor }">
 *     Strength: {{ strengthLabel }}
 *   </div>
 *   <ul v-if="errors.length">
 *     <li v-for="error in errors" :key="error">{{ error }}</li>
 *   </ul>
 * </template>
 * ```
 */
export function usePasswordStrength(
  password: MaybeRefOrGetter<string>,
  userContext?: PasswordUserContext,
  options?: UsePasswordStrengthOptions
) {
  /**
   * Password strength score (0-4)
   */
  const strength = computed(() => {
    const pwd = toValue(password);
    if (!pwd) return 0;
    return PasswordValidator.getPasswordStrength(pwd);
  });

  /**
   * Human-readable strength label
   */
  const strengthLabel = computed(() => {
    return PasswordValidator.getStrengthLabel(strength.value);
  });

  /**
   * Color for strength indicator
   */
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
   * Validation errors (error keys or translated messages)
   */
  const errors = computed(() => {
    const pwd = toValue(password);
    if (!pwd) return [];

    const context = userContext
      ? {
          email: toValue(userContext.email),
          username: toValue(userContext.username),
          firstName: toValue(userContext.firstName),
          lastName: toValue(userContext.lastName),
        }
      : undefined;

    const result = PasswordValidator.validatePassword(pwd, context);

    // If custom messages provided, map keys to messages
    if (options?.errorMessages) {
      return result.errorKeys.map((key) => options.errorMessages![key]);
    }

    // Otherwise return keys as strings (backward compatible)
    return result.errorKeys as string[];
  });

  /**
   * Whether password is valid
   */
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
