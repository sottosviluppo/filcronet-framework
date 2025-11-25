import { z } from "zod";
import { PasswordValidator } from "@sottosviluppo/core";

/**
 * GDPR-compliant password validation schema
 * Validates against ENISA guidelines
 *
 * @export
 * @constant passwordSchema
 */
export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters long")
  .refine((password) => PasswordValidator.isStrongPassword(password), {
    message: "Password does not meet security requirements",
  })
  .superRefine((password, ctx) => {
    const errors = PasswordValidator.getPasswordErrors(password);
    if (errors.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: errors.join("; "),
      });
    }
  });

/**
 * Password schema with user context for personal data check
 *
 * @export
 * @function passwordWithContextSchema
 * @param {Object} userContext - User personal data
 * @returns {z.ZodEffects} Zod schema with context validation
 */
export const passwordWithContextSchema = (userContext: {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}) => {
  return z
    .string()
    .min(12, "Password must be at least 12 characters long")
    .superRefine((password, ctx) => {
      const errors = PasswordValidator.getPasswordErrors(password, userContext);
      if (errors.length > 0) {
        errors.forEach((error) => {
          ctx.addIssue({
            code: "custom",
            message: error,
          });
        });
      }
    });
};

/**
 * Login credentials schema
 *
 * @export
 * @constant loginSchema
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Registration schema with GDPR-compliant password
 *
 * @export
 * @constant registerSchema
 */
export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    username: z
      .string()
      .regex(
        /^[a-zA-Z0-9_-]{3,30}$/,
        "Username can only contain letters, numbers, underscores and hyphens (3-30 characters)"
      )
      .optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

/**
 * Registration schema with context-aware password validation
 * Checks if password contains personal data
 *
 * @export
 * @function createRegisterSchema
 * @description Creates a registration schema that validates password against user context
 * Use this when you need real-time validation as user types
 *
 * @example
 * ```typescript
 * const formData = ref({ email: '', password: '', ... });
 *
 * const schema = computed(() =>
 *   createRegisterSchema({
 *     email: formData.value.email,
 *     username: formData.value.username,
 *     firstName: formData.value.firstName,
 *     lastName: formData.value.lastName,
 *   })
 * );
 *
 * // Then validate with schema.value.parse(formData.value)
 * ```
 */
export function createRegisterSchema(userContext: {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}) {
  return z
    .object({
      email: z.string().email("Invalid email address"),
      username: z
        .string()
        .regex(
          /^[a-zA-Z0-9_-]{3,30}$/,
          "Username can only contain letters, numbers, underscores and hyphens (3-30 characters)"
        )
        .optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      password: passwordWithContextSchema(userContext),
      confirmPassword: z.string(),
    })
    .refine((formData) => formData.password === formData.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });
}

/**
 * Reset password schema
 *
 * @export
 * @constant resetPasswordSchema
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

/**
 * Set password schema (invitation)
 *
 * @export
 * @constant setPasswordSchema
 */
export const setPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

/**
 * Forgot password schema
 *
 * @export
 * @constant forgotPasswordSchema
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});
