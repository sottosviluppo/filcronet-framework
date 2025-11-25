import { ref } from "vue";
import { useAuthStore } from "../../stores";

/**
 * Password recovery composable
 * Handles forgot password, reset password, and set password flows
 *
 * @export
 * @function usePasswordRecovery
 *
 * @example
 * ```vue
 * <script setup>
 * import { usePasswordRecovery } from '@filcronet/auth-frontend';
 *
 * const { forgotPassword, resetPassword, isLoading, error } = usePasswordRecovery();
 *
 * async function handleForgotPassword(email: string) {
 *   await forgotPassword(email, 'https://app.com/reset-password');
 * }
 * </script>
 * ```
 */
export function usePasswordRecovery() {
  const authStore = useAuthStore();
  const authApi = authStore.getAuthApi();

  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  /**
   * Request password reset
   *
   * @param {string} email - User email
   * @param {string} resetUrl - Base URL for reset page
   * @returns {Promise<void>}
   */
  async function forgotPassword(
    email: string,
    resetUrl: string
  ): Promise<void> {
    isLoading.value = true;
    error.value = null;
    successMessage.value = null;

    try {
      await authApi.forgotPassword(email, resetUrl);
      successMessage.value =
        "If an account with that email exists, a password reset link has been sent";
    } catch (err: any) {
      error.value = err.message || "Failed to send reset email";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Reset password with token
   *
   * @param {string} token - Reset token from email
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async function resetPassword(
    token: string,
    newPassword: string
  ): Promise<void> {
    isLoading.value = true;
    error.value = null;
    successMessage.value = null;

    try {
      await authApi.resetPassword(token, newPassword);
      successMessage.value = "Password reset successfully";
    } catch (err: any) {
      error.value = err.message || "Failed to reset password";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Set password from invitation
   *
   * @param {string} token - Invitation token
   * @param {string} password - Password to set
   * @returns {Promise<void>}
   */
  async function setPassword(token: string, password: string): Promise<void> {
    isLoading.value = true;
    error.value = null;
    successMessage.value = null;

    try {
      await authApi.setPassword(token, password);
      successMessage.value = "Password set successfully";
    } catch (err: any) {
      error.value = err.message || "Failed to set password";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Validate a token
   *
   * @param {string} token - Token to validate
   * @param {'password_reset' | 'invitation'} type - Token type
   * @returns {Promise<{ valid: boolean; email?: string }>}
   */
  async function validateToken(
    token: string,
    type: "password_reset" | "invitation"
  ): Promise<{ valid: boolean; email?: string }> {
    isLoading.value = true;
    error.value = null;

    try {
      return await authApi.validateToken(token, type);
    } catch (err: any) {
      return { valid: false };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Clear error and success messages
   */
  function clearMessages(): void {
    error.value = null;
    successMessage.value = null;
  }

  return {
    isLoading,
    error,
    successMessage,
    forgotPassword,
    resetPassword,
    setPassword,
    validateToken,
    clearMessages,
  };
}
