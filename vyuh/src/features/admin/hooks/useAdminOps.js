import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '@/services'
import { queryKeys } from '@/app/providers/queryClient.js'
import { useAdminId } from './useAdmin.js'

/**
 * The actions the office takes: importing a sheet, settling an integrity flag,
 * producing a report, moderating a message. Every one of them writes to the
 * audit ledger, so every one invalidates it.
 */

function useConsoleInvalidator() {
  const adminId = useAdminId()
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['admin', adminId] })
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
