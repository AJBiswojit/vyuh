import { useCallback, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '@/services'
import { queryKeys } from '@/app/providers/queryClient.js'
import { useAdminId } from './useAdmin.js'

/**
 * The actions the office takes: importing a sheet, settling an integrity flag,
 * producing a report, moderating a message. Every one of them writes to the
 * audit ledger, so every one invalidates it.
 */

/* BATCH 3.1 (WS2 / R-1) — one-time credentials live ONLY in these three
 * mutations' transient results. TanStack Query's `mutation.reset()` detaches the
 * observer but leaves the `Mutation` (and its `state.data`) in the
 * MutationCache until `gcTime`. These keys let us REMOVE those entries on close,
 * unmount and navigation, with no effect on any other mutation. */
export const TRANSIENT_CREDENTIAL_MUTATION_KEY = ['admin', 'credentials', 'transient']

/** @param {import('@tanstack/react-query').QueryClient} queryClient */
export function clearTransientCredentialMutations(queryClient) {
  const cache = queryClient.getMutationCache()
  for (const mutation of cache.findAll({ mutationKey: TRANSIENT_CREDENTIAL_MUTATION_KEY, exact: false })) {
    cache.remove(mutation)
  }
}

/** Clears credential results on unmount (navigation / route change / sign-out). */
export function useTransientCredentialLifecycle() {
  const queryClient = useQueryClient()
  const clear = useCallback(() => clearTransientCredentialMutations(queryClient), [queryClient])
  useEffect(() => () => clear(), [clear])
  return clear
}

function useConsoleInvalidator() {
  const adminId = useAdminId()
  const queryClient = useQueryClient()
  /**
   * Batch 3: an account write changes the console AND the downstream
   * seat-scoped workspaces (roster counts, faculty name, empty student data).
   * Invalidate both namespaces; never seed a mutation result into the cache.
   */
  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin', adminId] })
    queryClient.invalidateQueries({ queryKey: ['faculty'] })
    queryClient.invalidateQueries({ queryKey: ['students'] })
    queryClient.invalidateQueries({ queryKey: ['batches'] })
  }
}

/* ── CSV import ───────────────────────────────────────────────────────── */

/**
 * Field labels, header aliases and the sample sheets. They come from the service
 * like every other read, so the wizard never imports a fixture.
 */
export function useImportTemplate() {
  const adminId = useAdminId()
  return useQuery({
    queryKey: ['admin', adminId, 'import', 'template'],
    queryFn: () => services.admin.getImportTemplate(),
    enabled: Boolean(adminId),
    staleTime: Infinity,
  })
}

export function useImportPreview() {
  const adminId = useAdminId()
  return useMutation({
    mutationFn: (/** @type {{ csv: string, mapping: Record<string,string>, fixes?: Record<number, Record<string,string>>, skipped?: number[] }} */ input) =>
      services.admin.previewImport(adminId, input),
  })
}

export function useCommitImport() {
  const adminId = useAdminId()
  const invalidate = useConsoleInvalidator()
  return useMutation({
    mutationKey: [...TRANSIENT_CREDENTIAL_MUTATION_KEY, 'import'],
    mutationFn: (/** @type {{ csv: string, mapping: Record<string,string>, fixes?: Record<number, Record<string,string>>, skipped?: number[], fileName?: string }} */ input) =>
      services.admin.commitImport(adminId, input),
    onSuccess: () => invalidate(),
  })
}

/* ── Integrity ────────────────────────────────────────────────────────── */

export function useIntegrityReports() {
  const adminId = useAdminId()
  return useQuery({
    queryKey: queryKeys.admin.integrityReports(adminId),
    queryFn: () => services.admin.listIntegrityReports(adminId),
    enabled: Boolean(adminId),
  })
}

/** @param {string} examId */
export function useIntegrityReport(examId) {
  const adminId = useAdminId()
  return useQuery({
    queryKey: queryKeys.admin.integrityReport(adminId, examId),
    queryFn: () => services.admin.getIntegrityReport(adminId, examId),
    enabled: Boolean(adminId && examId),
  })
}

export function useDecideIntegrity() {
  const adminId = useAdminId()
  const invalidate = useConsoleInvalidator()
  return useMutation({
    mutationFn: (/** @type {{ examId: string, sessionId: string, decision: import('@/contracts/admin.js').IntegrityDecision, note: string }} */ input) =>
      services.admin.decideIntegrity(adminId, input),
    onSuccess: () => invalidate(),
  })
}

/* ── Reports ──────────────────────────────────────────────────────────── */

export function useRunReport() {
  const adminId = useAdminId()
  const invalidate = useConsoleInvalidator()
  return useMutation({
    mutationFn: (/** @type {import('@/contracts/admin.js').ReportRequest} */ request) =>
      services.admin.runReport(adminId, request),
    onSuccess: () => invalidate(),
  })
}

/* ── Moderation ───────────────────────────────────────────────────────── */

/** @param {{ kind?: 'all'|'doubt'|'chat', status?: 'all'|import('@/contracts/admin.js').ModerationStatus }} filter */
export function useModeration(filter) {
  const adminId = useAdminId()
  return useQuery({
    queryKey: queryKeys.admin.moderation(adminId, filter),
    queryFn: () => services.admin.listModeration(adminId, filter),
    enabled: Boolean(adminId),
    placeholderData: (previous) => previous,
  })
}

export function useDecideModeration() {
  const adminId = useAdminId()
  const invalidate = useConsoleInvalidator()
  return useMutation({
    mutationFn: (/** @type {{ id: string, decision: 'remove'|'dismiss'|'warn', note?: string }} */ input) =>
      services.admin.decideModeration(adminId, input),
    onSuccess: () => invalidate(),
  })
}

/* ── Audit ────────────────────────────────────────────────────────────── */

/** @param {import('@/contracts/admin.js').AuditQuery} query */
export function useAuditLog(query) {
  const adminId = useAdminId()
  return useQuery({
    queryKey: queryKeys.admin.audit(adminId, query),
    queryFn: () => services.admin.listAudit(adminId, query),
    enabled: Boolean(adminId),
    placeholderData: (previous) => previous,
  })
}

/* ── Batch 3 — Admin People Management ────────────────────────────────────
 * Mutation results that carry a transient credential are consumed by the
 * caller's component-local state and then discarded with `reset()`. No hook
 * here writes a credential into the query cache, a session or storage.
 * ------------------------------------------------------------------------- */

export function useInstituteIdConfig() {
  const adminId = useAdminId()
  return useQuery({
    queryKey: queryKeys.admin.instituteIdConfig(adminId),
    queryFn: () => services.admin.getInstituteIdConfig(adminId),
    enabled: Boolean(adminId),
  })
}

export function useConfigureInstituteIds() {
  const adminId = useAdminId()
  const invalidate = useConsoleInvalidator()
  return useMutation({
    mutationFn: (/** @type {{ year: string|null }} */ input) => services.admin.configureInstituteIds(adminId, input),
    onSuccess: () => invalidate(),
  })
}

/** @param {'student'|'faculty'} role @param {boolean} [enabled] */
export function useInstituteIdPreview(role, enabled = true) {
  const adminId = useAdminId()
  return useQuery({
    queryKey: ['admin', adminId, 'institute-id-preview', role],
    queryFn: () => services.admin.previewInstituteId(adminId, { role }),
    enabled: Boolean(adminId && role && enabled),
  })
}

export function useCreateUser() {
  const adminId = useAdminId()
  const invalidate = useConsoleInvalidator()
  return useMutation({
    mutationKey: [...TRANSIENT_CREDENTIAL_MUTATION_KEY, 'create'],
    mutationFn: (/** @type {import('@/contracts/admin.js').CreateUserInput} */ input) => services.admin.createUser(adminId, input),
    onSuccess: () => invalidate(),
  })
}

export function useMarkCredentialsShown() {
  const adminId = useAdminId()
  const invalidate = useConsoleInvalidator()
  return useMutation({
    mutationFn: (/** @type {{ accountKeys: string[] }} */ input) => services.admin.markCredentialsShown(adminId, input),
    onSuccess: () => invalidate(),
  })
}

export function useAccountOperation() {
  const adminId = useAdminId()
  const invalidate = useConsoleInvalidator()
  return useMutation({
    mutationFn: (/** @type {{ operation: import('@/contracts/admin.js').AccountOperation, input: import('@/contracts/admin.js').AccountOperationInput }} */ { operation, input }) =>
      services.admin.applyAccountOperation(adminId, operation, input),
    onSuccess: () => invalidate(),
  })
}

export function useEditAccount() {
  const adminId = useAdminId()
  const invalidate = useConsoleInvalidator()
  return useMutation({
    mutationFn: (/** @type {import('@/contracts/admin.js').AccountEditInput} */ input) => services.admin.editAccount(adminId, input),
    onSuccess: () => invalidate(),
  })
}

export function useMoveStudentBatch() {
  const adminId = useAdminId()
  const invalidate = useConsoleInvalidator()
  return useMutation({
    mutationFn: (/** @type {import('@/contracts/admin.js').BatchMoveInput} */ input) => services.admin.moveStudentBatch(adminId, input),
    onSuccess: () => invalidate(),
  })
}

export function useReissueTemporaryPassword() {
  const adminId = useAdminId()
  const invalidate = useConsoleInvalidator()
  return useMutation({
    mutationKey: [...TRANSIENT_CREDENTIAL_MUTATION_KEY, 'reissue'],
    mutationFn: (/** @type {import('@/contracts/admin.js').ReissueCredentialInput} */ input) => services.admin.reissueTemporaryPassword(adminId, input),
    onSuccess: () => invalidate(),
  })
}
