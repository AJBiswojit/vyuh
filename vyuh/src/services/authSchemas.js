/**
 * Shared auth validation. Forms use these schemas before submitting; services
 * use them again at the boundary. API response schemas re-export the session
 * schema so persistence and HTTP restore agree on the same contract.
 */
import { z } from 'zod'

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address.').max(254))
export const loginPasswordSchema = z.string().min(1, 'Enter your password.').max(128, 'Use at most 128 characters.')
export const newPasswordSchema = z.string()
  .min(10, 'Use at least 10 characters.')
  .max(128, 'Use at most 128 characters.')
  .regex(/[a-zA-Z]/, 'Include at least one letter.')
  .regex(/[0-9]/, 'Include at least one number.')

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
})

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name (at least 2 characters).').max(80, 'Use at most 80 characters.'),
  email: emailSchema,
  instituteCode: z.string().trim().toUpperCase().pipe(z.string().min(1, 'Enter the code from your institute.').max(24, 'Check the institute code.')),
  batchId: z.string().min(1, 'Choose your batch.'),
  password: newPasswordSchema,
  guardianEmail: z.union([z.literal(''), emailSchema]).optional().transform((value) => value || undefined),
  termsConsent: z.literal(true, { error: 'Accept the Terms to create an account.' }),
  attendanceConsent: z.literal(true, { error: 'Accept the attendance data policy to continue.' }),
})

export const otpSchema = z.object({
  challengeId: z.string().min(1, 'Start a new verification request.'),
  code: z.string().regex(/^\d{6}$/, 'Enter all six digits.'),
})
export const forgotPasswordSchema = z.object({ email: emailSchema })
export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1, 'This reset link is incomplete. Request a new one.'),
  password: newPasswordSchema,
})
export const resetPasswordSchema = resetPasswordRequestSchema.extend({
  confirmPassword: z.string().min(1, 'Enter your new password again.'),
}).refine((value) => value.password === value.confirmPassword, {
  path: ['confirmPassword'], error: 'The passwords do not match.',
})
export const acceptInviteRequestSchema = z.object({
  inviteCode: z.string().min(1, 'Open the invitation link from your email.'),
  password: newPasswordSchema,
})
export const acceptInviteSchema = acceptInviteRequestSchema.extend({
  confirmPassword: z.string().min(1, 'Enter your new password again.'),
}).refine((value) => value.password === value.confirmPassword, {
  path: ['confirmPassword'], error: 'The passwords do not match.',
})

export const roleSchema = z.enum(['student', 'faculty', 'admin'])
export const userSchema = z.object({
  id: z.string().min(1), name: z.string().min(1), email: emailSchema,
  role: roleSchema, initials: z.string().length(2), phone: z.string().optional(),
  joinedAt: z.string().min(1), instituteCode: z.string().optional(),
  batchId: z.string().optional(), batchName: z.string().optional(), guardianEmail: emailSchema.optional(),
})
export const authSessionSchema = z.object({
  token: z.string().min(1), user: userSchema,
  expiresInSeconds: z.number().int().positive(),
  issuedAt: z.number().int().positive(), expiresAt: z.number().int().positive(),
}).refine((value) => value.expiresAt > value.issuedAt, { error: 'Invalid session lifetime.' })
export const authChallengeSchema = z.object({
  id: z.string().min(1), email: emailSchema, purpose: z.enum(['signup', 'reset']),
  expiresAt: z.number(), resendAvailableAt: z.number(), demoCode: z.string().length(6).optional(),
})
export const resetRequestSchema = z.object({ message: z.string(), demoResetPath: z.string().optional() })
export const signupOptionsSchema = z.object({
  instituteName: z.string(), demoInstituteCode: z.string(),
  batches: z.array(z.object({ id: z.string(), name: z.string(), track: z.string(), scheduleLabel: z.string() })),
})
export const facultyInviteSchema = z.object({
  code: z.string(), name: z.string(), email: emailSchema, instituteName: z.string(),
  status: z.enum(['active', 'expired', 'accepted']), expiresAt: z.number(),
})

/** @param {z.ZodError} error */
export function fieldErrors(error) {
  /** @type {Record<string, string>} */
  const result = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!result[key]) result[key] = issue.message
  }
  return result
}
