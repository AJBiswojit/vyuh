import { useCallback, useRef, useState } from 'react'
import { fieldErrors } from '@/services/authSchemas.js'

/**
 * Validate on blur and submit, then revalidate touched fields as they change.
 * Native form submission is retained, so Enter works from every text field.
 * @template T
 * @template {Record<string, unknown>} V
 * @param {import('zod').ZodType<T>} schema
 * @param {V} initialValues
 */
export function useZodForm(schema, initialValues) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */ ({}))
  const touched = useRef(new Set())
  const formRef = useRef(/** @type {HTMLFormElement | null} */ (null))
  const registerForm = useCallback((/** @type {HTMLFormElement | null} */ node) => { formRef.current = node }, [])

  /** @param {keyof V & string} name @param {V[keyof V]} value */
  function setValue(name, value) {
    const next = { ...values, [name]: value }
    setValues(next)
    if (touched.current.has(name)) {
      const parsed = schema.safeParse(next)
      setErrors((current) => {
        const updated = { ...current }
        delete updated[name]
        if (!parsed.success) {
          const issue = fieldErrors(parsed.error)[name]
          if (issue) updated[name] = issue
        }
        return updated
      })
    }
  }
  /** @param {keyof T & string} name */
  function onBlur(name) {
    touched.current.add(name)
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      const message = fieldErrors(parsed.error)[name]
      if (message) setErrors((current) => ({ ...current, [name]: message }))
    }
  }
  /** @param {Record<string, string>} nextErrors */
  function focusFirstError(nextErrors) {
    requestAnimationFrame(() => {
      const first = Object.keys(nextErrors)[0]
      const field = formRef.current?.elements.namedItem(first)
      const target = field instanceof HTMLElement ? field : formRef.current?.querySelector('[aria-invalid="true"]')
      if (target instanceof HTMLElement) target.focus()
    })
  }
  /** @param {React.FormEvent<HTMLFormElement>} event @param {(values: T) => void | Promise<void>} onSubmit */
  async function handleSubmit(event, onSubmit) {
    event.preventDefault()
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      const nextErrors = fieldErrors(parsed.error)
      setErrors(nextErrors)
      focusFirstError(nextErrors)
      return
    }
    setErrors({})
    await onSubmit(parsed.data)
  }
  return { values, errors, setValue, onBlur, handleSubmit, registerForm, setErrors }
}
