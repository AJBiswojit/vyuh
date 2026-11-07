import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '@/services'
import { queryKeys } from '@/app/providers/queryClient.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'

/**
 * The office seat. A single console: the academic office reads across every
 * batch, so unlike the faculty hooks there is no per-seat scoping to do — but
 * the id is still passed through, because an institution with more than one
 * campus will scope by it.
 * @returns {string}
 */
export function useAdminId() {
  return useSessionStore((state) => (state.user?.role === 'admin' ? state.user.id : 'adm-pratibha'))
}

/** Invalidate every console read. Decisions in one screen change another. */
function useAdminInvalidator() {
  const adminId = useAdminId()
  const queryClient = useQueryClient()
  return (/** @type {string[]} */ extra = []) => {
    queryClient.invalidateQueries({ queryKey: ['admin', adminId] })
    for (const key of extra) queryClient.invalidateQueries({ queryKey: ['admin', adminId, key] })
  }
}

/** @returns {import('@tanstack/react-query').UseQueryResult<import('@/contracts/admin.js').AdminDashboard>} */
export function useAdminDashboard() {
  const adminId = useAdminId()
  return useQuery({
    queryKey: queryKeys.admin.dashboard(adminId),
    queryFn: () => services.admin.getDashboard(adminId),
    enabled: Boolean(adminId),
  })
}

/* ── Users ────────────────────────────────────────────────────────────── */

/** @param {import('@/contracts/admin.js').UserQuery} query */
export function useAdminUsers(query) {
  const adminId = useAdminId()
  return useQuery({
    queryKey: queryKeys.admin.users(adminId, query),
    queryFn: () => services.admin.listUsers(adminId, query),
    enabled: Boolean(adminId),
    placeholderData: (previous) => previous,
  })
}

/* ── Batches ──────────────────────────────────────────────────────────── */

export function useAdminBatches() {
  const adminId = useAdminId()
  return useQuery({
    queryKey: queryKeys.admin.batches(adminId),
    queryFn: () => services.admin.listAdminBatches(adminId),
    enabled: Boolean(adminId),
  })
}

/** @param {string} batchId */
export function useAdminBatch(batchId) {
  const adminId = useAdminId()
  return useQuery({
    queryKey: queryKeys.admin.batch(adminId, batchId),
    queryFn: () => services.admin.getAdminBatch(adminId, batchId),
    enabled: Boolean(adminId && batchId),
  })
}

export function useSaveBatchFaculty() {
  const adminId = useAdminId()
  const invalidate = useAdminInvalidator()
  return useMutation({
    mutationFn: (/** @type {{ batchId: string, facultyIds: string[] }} */ input) =>
      services.admin.saveBatchFaculty(adminId, input.batchId, input.facultyIds),
    onSuccess: () => invalidate(['batch', 'batches', 'dashboard']),
  })
}

/* ── Approvals ────────────────────────────────────────────────────────── */

/** @param {'all'|'pending'|'approved'|'rejected'} status */
export function useApprovals(status = 'all') {
  const adminId = useAdminId()
  return useQuery({
    queryKey: queryKeys.admin.approvals(adminId, status),
    queryFn: () => services.admin.listApprovals(adminId, { status }),
    enabled: Boolean(adminId),
    placeholderData: (previous) => previous,
  })
}

export function useDecideApproval() {
  const adminId = useAdminId()
  const invalidate = useAdminInvalidator()
  return useMutation({
    mutationFn: (/** @type {{ examId: string, decision: 'approve'|'reject'|'schedule', note?: string, windowStart?: string, windowEnd?: string }} */ input) =>
      services.admin.decideApproval(adminId, input.examId, {
        decision: input.decision,
        note: input.note,
        windowStart: input.windowStart,
        windowEnd: input.windowEnd,
      }),
    onSuccess: () => invalidate(['approvals', 'dashboard']),
  })
}

/* ── Policies ─────────────────────────────────────────────────────────── */

export function usePolicies() {
  const adminId = useAdminId()
  return useQuery({
    queryKey: queryKeys.admin.policies(adminId),
    queryFn: () => services.admin.listPolicies(adminId),
    enabled: Boolean(adminId),
  })
}

export function usePolicyHistory() {
  const adminId = useAdminId()
  return useQuery({
    queryKey: queryKeys.admin.policyHistory(adminId),
    queryFn: () => services.admin.listPolicyHistory(adminId),
    enabled: Boolean(adminId),
  })
}

/**
 * The impact of a proposed value. Disabled until a dialog is open, because the
 * count is only ever asked for as the prelude to a decision.
 * @param {string} key
 * @param {string|number} value
 * @param {boolean} [enabled]
 */
export function usePolicyImpact(key, value, enabled = true) {
  const adminId = useAdminId()
  return useQuery({
    queryKey: queryKeys.admin.policyImpact(adminId, key, value),
    queryFn: () => services.admin.getPolicyImpact(adminId, key, value),
    enabled: Boolean(adminId && key && enabled),
  })
}

export function useUpdatePolicy() {
  const adminId = useAdminId()
  const invalidate = useAdminInvalidator()
  return useMutation({
    mutationFn: (/** @type {{ key: string, value: string|number, note?: string }} */ input) =>
      services.admin.updatePolicy(adminId, input),
    onSuccess: () => invalidate(['policies', 'batches', 'dashboard']),
  })
}

/* ── Branding ─────────────────────────────────────────────────────────── */

export function useBranding() {
  const adminId = useAdminId()
  return useQuery({
    queryKey: queryKeys.admin.branding(adminId),
    queryFn: () => services.admin.getBranding(adminId),
    enabled: Boolean(adminId),
  })
}

export function useSaveBranding() {
  const adminId = useAdminId()
  const invalidate = useAdminInvalidator()
  return useMutation({
    mutationFn: (/** @type {Partial<import('@/contracts/admin.js').Branding>} */ input) =>
      services.admin.saveBranding(adminId, input),
    onSuccess: () => invalidate(['branding', 'dashboard']),
  })
}
