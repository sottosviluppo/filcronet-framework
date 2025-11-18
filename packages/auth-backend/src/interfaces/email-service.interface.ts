/**
 * Email service interface
 * Projects must implement this interface to send emails
 *
 * @export
 * @interface IEmailService
 */
export interface IEmailService {
  /**
   * Sends password reset email
   *
   * @param {string} email - Recipient email address
   * @param {string} token - Password reset token
   * @param {string} resetUrl - Complete reset URL with token
   * @returns {Promise<void>}
   * @memberof IEmailService
   */
  sendPasswordResetEmail(
    email: string,
    token: string,
    resetUrl: string
  ): Promise<void>;

  /**
   * Sends invitation email for setting password
   *
   * @param {string} email - Recipient email address
   * @param {string} token - Invitation token
   * @param {string} invitationUrl - Complete invitation URL with token
   * @returns {Promise<void>}
   * @memberof IEmailService
   */
  sendInvitationEmail(
    email: string,
    token: string,
    invitationUrl: string
  ): Promise<void>;
}
