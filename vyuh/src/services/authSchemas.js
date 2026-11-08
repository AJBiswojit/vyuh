/**
 * Shared auth validation. Forms use these schemas before submitting; services
 * use them again at the boundary. API response schemas re-export the session
 * schema so persistence and HTTP restore agree on the same contract.
 *
 * Batch 2: the login identifier is either a seeded demo email or an issued
 * Institute ID. Both pass through one schema, so an unknown ID and a wrong
 * password can share one generic error (no account enumeration).
 */
import { z } from 'zod'

/** Institute ID shapes. One institute-wide series per role; admin is 3 digits. */
export const INSTITUTE_ID_PATTERNS = Object.freeze({
  student: /^VYU-S-\d{2}-\d{4}$/,
  faculty: /^VYU-F-\d{4}$/,
  admin: /^VYU-A-\d{3}$/,
})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const INSTITUTE_ID_RE = /^VYU-(?:S-\d{2}-\d{4}|F-\d{4}|A-\d{3})$/

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address.').max(254))
export const loginPasswordSchema = z.string().min(1, 'Enter your password.').max(128, 'Use at most 128 characters.')
export const newPasswordSchema = z.string()
  .min(10, 'Use at least 10 characters.')
  .max(128, 'Use at most 128 characters.')
  .regex(/[a-zA-Z]/, 'Include at least one letter.')
  .regex(/[0-9]/, 'Include at least one number.')

export const instituteIdSchema = z.string().trim().toUpperCase().regex(INSTITUTE_ID_RE, 'Enter a valid Institute ID.')

/**
 * One identifier field. Emails are lowercased, Institute IDs uppercased. The
 * empty-value message is preserved from the original email-only schema so the
 * existing inline-validation regression keeps its exact copy.
 */
export const loginIdentifierSchema = z.string().trim()
  .min(1, 'Enter a valid email address.')
  .max(254, 'Use at most 254 characters.')
  .refine((value) => EMAIL_RE.test(value) || INSTITUTE_ID_RE.test(value.toUpperCase()), 'Enter a valid email address or Institute ID.')
  .transform((value) => EMAIL_RE.test(value) ? value.toLowerCase() : value.toUpperCase())

export const loginSchema = z.object({
  email: loginIdentifierSchema,
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

/**
 * First-login password setup. The service compares the submitted value against
 * the stored temporary digest and rejects an unchanged credential; no plaintext
 * temporary password is ever passed to or stored by this schema.
 */
export const setupAccountSchema = z.object({
  newPassword: newPasswordSchema,
  confirmPassword: z.string().min(1, 'Enter your new password again.'),
}).refine((value) => value.newPassword === value.confirmPassword, {
  path: ['confirmPassword'], error: 'The passwords do not match.',
})

/**
 * Boundary validation for the identity foundation. `admin` provisioning is
 * rejected by the service (Admin-created Admin accounts are out of Batch 2).
 */
export const instituteAccountInputSchema = z.object({
  role: z.enum(['student', 'faculty', 'admin']),
  name: z.string().trim().min(2, 'Enter the account holder name.').max(80, 'Use at most 80 characters.'),
  email: emailSchema,
  phone: z.string().trim().max(32).optional(),
  batchId: z.string().trim().min(1).optional(),
  batchName: z.string().trim().min(1).optional(),
})

export const accountStatusSchema = z.enum(['active', 'invited', 'suspended', 'locked', 'archived'])

export const roleSchema = z.enum(['student', 'faculty', 'admin'])
export const userSchema = z.object({
  id: z.string().min(1), name: z.string().min(1), email: emailSchema,
  role: roleSchema, initials: z.string().length(2), phone: z.string().optional(),
  joinedAt: z.string().min(1), instituteCode: z.string().optional(),
  batchId: z.string().optional(), batchName: z.string().optional(), guardianEmail: emailSchema.optional(),
  /* Optional Batch 2 identity metadata. Demo fixtures carry none of it. */
  instituteId: z.string().optional(),
  mustChangePassword: z.boolean().optional(),
  acknowledgedPolicyVersion: z.string().nullable().optional(),
})
export const authSessionSchema = z.object({
  token: z.string().min(1), user: userSchema,
  expiresInSeconds: z.number().int().positive(),
  issuedAt: z.number().int().positive(), expiresAt: z.number().int().positive(),
  /* Optional identity / first-login metadata. Never a password or a hash. */
  instituteId: z.string().optional(),
  mustChangePassword: z.boolean().optional(),
  acknowledgedPolicyVersion: z.string().nullable().optional(),
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
