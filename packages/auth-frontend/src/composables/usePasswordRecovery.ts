import { ref } from "vue";
import { useAuthStore } from "../stores";
import type { AxiosError } from "axios";

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

  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  /**
   * Requests password reset
   *
   * @param {string} email - User email
   * @param {string} resetUrlBase - Base URL for reset page
   * @returns {Promise<void>}
   */
  async function forgotPassword(
    email: string,
    resetUrlBase: string
  ): Promise<void> {
    isLoading.value = true;
    error.value = null;
    successMessage.value = null;

    try {
      const apiClient = authStore.getApiClient();
      const response = await apiClient.post(
        "/auth/forgot-password",
        { email },
        { params: { resetUrl: resetUrlBase } }
      );

      successMessage.value = response.data.message;
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      error.value =
        axiosError.response?.data?.message || "Failed to send reset email";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Resets password with token
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
      const apiClient = authStore.getApiClient();
      const response = await apiClient.post("/auth/reset-password", {
        token,
        newPassword,
      });

      successMessage.value = response.data.message;
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      error.value =
        axiosError.response?.data?.message || "Failed to reset password";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Sets password from invitation
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
      const apiClient = authStore.getApiClient();
      const response = await apiClient.post("/auth/set-password", {
        token,
        password,
      });

      successMessage.value = response.data.message;
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      error.value =
        axiosError.response?.data?.message || "Failed to set password";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Validates a token
   *
   * @param {string} token - Token to validate
   * @param {string} type - Token type (password_reset or invitation)
   * @returns {Promise<{ valid: boolean; email?: string }>}
   */
  async function validateToken(
    token: string,
    type: "password_reset" | "invitation"
  ): Promise<{ valid: boolean; email?: string }> {
    isLoading.value = true;
    error.value = null;

    try {
      const apiClient = authStore.getApiClient();
      const response = await apiClient.get("/auth/validate-token", {
        params: { token, type },
      });

      return response.data;
    } catch (err) {
      return { valid: false };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Clears error and success messages
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
