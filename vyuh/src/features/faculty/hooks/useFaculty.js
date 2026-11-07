import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { services } from '@/services'
import { queryKeys } from '@/app/providers/queryClient.js'
import { useSessionStore } from '@/shared/store/sessionStore.js'

/**
 * The faculty seat. A faculty member's own id scopes every read and write, so a
 * second seat would keep its own bank and its own drafts.
 * @returns {string}
 */
export function useFacultyId() {
  return useSessionStore((state) => (state.user?.role === 'faculty' ? state.user.id : 'fac-snehasish'))
}

/** @returns {import('@/contracts/faculty.js').FacultyDashboard | undefined} */
export function useFacultyDashboard() {
  const facultyId = useFacultyId()
  return useQuery({
    queryKey: queryKeys.faculty.dashboard(facultyId),
    queryFn: () => services.faculty.getDashboard(facultyId),
    enabled: Boolean(facultyId),
  })
}

/* ── Question bank ────────────────────────────────────────────────────── */

/**
 * @param {import('@/contracts/faculty.js').BankQuery} query
 */
export function useBankQuestions(query) {
  const facultyId = useFacultyId()
  return useQuery({
    queryKey: queryKeys.faculty.bank(facultyId, query),
    queryFn: () => services.faculty.listBankQuestions(facultyId, query),
    enabled: Boolean(facultyId),
    placeholderData: (previous) => previous,
  })
}

/** @param {string} questionId */
export function useBankQuestion(questionId) {
  const facultyId = useFacultyId()
  return useQuery({
    queryKey: queryKeys.faculty.question(facultyId, questionId),
    queryFn: () => services.faculty.getBankQuestion(facultyId, questionId),
    enabled: Boolean(facultyId && questionId),
  })
}

/**
 * Subtopics for a topic, so the editor can offer what already exists while still
 * accepting a new one typed by hand.
 * @param {string} topicId
 */
export function useSubtopics(topicId) {
  const facultyId = useFacultyId()
  return useQuery({
    queryKey: ['faculty', facultyId, 'subtopics', topicId],
    queryFn: () => services.faculty.listSubtopics(facultyId, topicId),
    enabled: Boolean(facultyId && topicId),
    staleTime: 5 * 60_000,
  })
}

/** @returns {import('@tanstack/react-query').UseMutationResult<import('@/contracts/faculty.js').BankQuestion, Error, import('@/contracts/faculty.js').QuestionInput>} */
export function useCreateQuestion() {
  const facultyId = useFacultyId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input) => services.faculty.createBankQuestion(facultyId, input),
    onSuccess: (question) => {
      queryClient.invalidateQueries({ queryKey: ['faculty', facultyId, 'bank'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.dashboard(facultyId) })
      queryClient.setQueryData(queryKeys.faculty.question(facultyId, question.id), question)
    },
  })
}

/** @param {string} questionId */
export function useUpdateQuestion(questionId) {
  const facultyId = useFacultyId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (/** @type {import('@/contracts/faculty.js').QuestionInput} */ input) =>
      services.faculty.updateBankQuestion(facultyId, questionId, input),
    onSuccess: (question) => {
      queryClient.invalidateQueries({ queryKey: ['faculty', facultyId, 'bank'] })
      queryClient.setQueryData(queryKeys.faculty.question(facultyId, questionId), question)
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.examPreview(facultyId, '') })
    },
  })
}

export function useDeleteQuestion() {
  const facultyId = useFacultyId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (/** @type {string} */ questionId) => services.faculty.deleteBankQuestion(facultyId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty', facultyId, 'bank'] })
    },
  })
}

/* ── Exam builder ─────────────────────────────────────────────────────── */

export function useExamPatterns() {
  return useQuery({ queryKey: ['faculty', 'patterns'], queryFn: () => services.faculty.listExamPatterns(), staleTime: 5 * 60_000 })
}

export function useFacultyExams() {
  const facultyId = useFacultyId()
  return useQuery({ queryKey: queryKeys.faculty.exams(facultyId), queryFn: () => services.faculty.listExams(facultyId), enabled: Boolean(facultyId) })
}

/** @param {string} examId */
export function useFacultyExam(examId) {
  const facultyId = useFacultyId()
  return useQuery({
    queryKey: queryKeys.faculty.exam(facultyId, examId),
    queryFn: () => services.faculty.getExam(facultyId, examId),
    enabled: Boolean(facultyId && examId),
  })
}

/** @param {string} examId */
export function useExamPreview(examId) {
  const facultyId = useFacultyId()
  return useQuery({
    queryKey: queryKeys.faculty.examPreview(facultyId, examId),
    queryFn: () => services.faculty.getExamPreview(facultyId, examId),
    enabled: Boolean(facultyId && examId),
  })
}

export function useCreateExam() {
  const facultyId = useFacultyId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (/** @type {{ title: string, preset: import('@/contracts/faculty.js').ExamPatternId }} */ input) =>
      services.faculty.createExam(facultyId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.faculty.exams(facultyId) }),
  })
}

/** @param {string} examId */
export function useSaveExam(examId) {
  const facultyId = useFacultyId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (/** @type {Partial<import('@/contracts/faculty.js').FacultyExam>} */ patch) =>
      services.faculty.saveExam(facultyId, examId, patch),
    onSuccess: (exam) => {
      queryClient.setQueryData(queryKeys.faculty.exam(facultyId, examId), exam)
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.exams(facultyId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.examPreview(facultyId, examId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.dashboard(facultyId) })
    },
  })
}

/** @param {string} examId */
export function useExamQuestionMutation(examId) {
  const facultyId = useFacultyId()
  const queryClient = useQueryClient()
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.faculty.exam(facultyId, examId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.faculty.examPreview(facultyId, examId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.faculty.exams(facultyId) })
  }
  const add = useMutation({
    mutationFn: (/** @type {{ sectionId: string, questionId: string }} */ input) =>
      services.faculty.addQuestionToExam(facultyId, examId, input.sectionId, input.questionId),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: (/** @type {{ sectionId: string, questionId: string }} */ input) =>
      services.faculty.removeQuestionFromExam(facultyId, examId, input.sectionId, input.questionId),
    onSuccess: refresh,
  })
  return { add, remove }
}

/**
 * Add a question from the bank preview to any editable paper. The paper is part
 * of the mutation variables, so one hook serves every row in the dialog.
 */
export function useAddQuestionToAnyExam() {
  const facultyId = useFacultyId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (/** @type {{ examId: string, sectionId: string, questionId: string }} */ input) =>
      services.faculty.addQuestionToExam(facultyId, input.examId, input.sectionId, input.questionId),
    onSuccess: (_exam, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.exam(facultyId, variables.examId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.examPreview(facultyId, variables.examId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.exams(facultyId) })
    },
  })
}

/** @param {string} examId */
export function useSetExamStatus(examId) {
  const facultyId = useFacultyId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (/** @type {import('@/contracts/faculty.js').FacultyExamStatus} */ status) =>
      services.faculty.setExamStatus(facultyId, examId, status),
    onSuccess: (exam) => {
      queryClient.setQueryData(queryKeys.faculty.exam(facultyId, examId), exam)
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.exams(facultyId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.dashboard(facultyId) })
    },
  })
}

export function useDeleteExam() {
  const facultyId = useFacultyId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (/** @type {string} */ examId) => services.faculty.deleteExam(facultyId, examId),
    onSuccess: (_data, examId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.exams(facultyId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.faculty.dashboard(facultyId) })
      queryClient.removeQueries({ queryKey: queryKeys.faculty.exam(facultyId, examId) })
    },
  })
}

/* ── Live monitor ─────────────────────────────────────────────────────── */

/**
 * Poll-free: the snapshot arrives once, then the service's scripted feed pushes
 * new snapshots into the cache. Counts therefore change as events arrive, not on
 * a timer owned by the component.
 * @param {string} examId
 */
export function useExamMonitor(examId) {
  const facultyId = useFacultyId()
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.faculty.monitor(facultyId, examId),
    queryFn: () => services.faculty.getMonitor(facultyId, examId),
    enabled: Boolean(facultyId && examId),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
  useEffect(() => {
    if (!facultyId || !examId) return undefined
    return services.faculty.subscribeMonitor(facultyId, examId, (snapshot) => {
      queryClient.setQueryData(queryKeys.faculty.monitor(facultyId, examId), snapshot)
    })
  }, [facultyId, examId, queryClient])
  return query
}

/* ── Item analysis ────────────────────────────────────────────────────── */

/** @param {string} examId */
export function useItemAnalysis(examId) {
  const facultyId = useFacultyId()
  return useQuery({
    queryKey: queryKeys.faculty.itemAnalysis(facultyId, examId),
    queryFn: () => services.faculty.getItemAnalysis(facultyId, examId),
    enabled: Boolean(facultyId && examId),
  })
}

/**
 * Marking an item faulty recalculates every score in the register. The mutation
 * writes the returned analysis straight into the cache, so the score table and
 * the student's own result sheet move together.
 * @param {string} examId
 */
export function useMarkFaulty(examId) {
  const facultyId = useFacultyId()
  const queryClient = useQueryClient()
  const apply = (/** @type {import('@/contracts/faculty.js').ItemAnalysis} */ analysis) => {
    queryClient.setQueryData(queryKeys.faculty.itemAnalysis(facultyId, examId), analysis)
    queryClient.invalidateQueries({ queryKey: ['exams', examId, 'analysis'] })
  }
  const mark = useMutation({
    mutationFn: (/** @type {string} */ questionId) => services.faculty.markQuestionFaulty(facultyId, examId, questionId),
    onSuccess: apply,
  })
  const restore = useMutation({
    mutationFn: (/** @type {string} */ questionId) => services.faculty.restoreQuestion(facultyId, examId, questionId),
    onSuccess: apply,
  })
  return { mark, restore }
}
