import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/app/providers/queryClient.js'
import { services } from '@/shared/lib/services.js'

/** @param {string | undefined} examId @param {string | undefined} studentId @param {string} [attemptId] */
export function useExamAnalysis(examId, studentId, attemptId) {
  return useQuery({
    queryKey: queryKeys.examAnalysis(examId ?? 'unknown', studentId ?? 'unknown', attemptId),
    queryFn: () => services.analysis.getAnalysis(/** @type {string} */ (examId), /** @type {string} */ (studentId), attemptId),
    enabled: Boolean(examId && studentId),
    staleTime: 30_000,
  })
}

/** @param {string | undefined} studentId @param {string | undefined} topicId */
export function useTopicRevision(studentId, topicId) {
  return useQuery({
    queryKey: queryKeys.topicRevision(studentId ?? 'unknown', topicId ?? 'unknown'),
    queryFn: () => services.analysis.getRevision(/** @type {string} */ (studentId), /** @type {string} */ (topicId)),
    enabled: Boolean(studentId && topicId),
  })
}

/** Server-corrected countdown for an unreleased sheet. @param {import('@/contracts/analysis.js').ReleasePolicy | undefined} release */
export function useReleaseCountdown(release) {
  const [now, setNow] = useState(() => Date.now())
  const released = release?.released
  const releaseAt = release?.releaseAt
  useEffect(() => {
    if (released || !releaseAt) return undefined
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [released, releaseAt])
  if (!release || release.released || !release.releaseAt) return 0
  return Math.max(0, Math.ceil((Date.parse(release.releaseAt) - (now + release.offsetMs)) / 1000))
}
