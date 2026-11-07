/**
 * Join class names, dropping falsy values. Deliberately not clsx: the app never
 * needs conditional object syntax and this keeps the bundle honest.
 * @param {...(string | false | null | undefined)} parts
 * @returns {string}
 */
export function cn(...parts) {
  return parts.filter(Boolean).join(' ')
}
