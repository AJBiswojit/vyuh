/** Small safe calculator parser. No eval/Function: the exam hall only needs
 * arithmetic, powers, parentheses, constants and scientific functions.
 * @typedef {'deg'|'rad'} AngleMode
 */

/** @param {string} input @param {AngleMode} [mode] @returns {number} */
export function calculateExpression(input, mode = 'rad') {
  const tokens = tokenize(input)
  let pos = 0
  /** @param {string} [value] */
  function peek(value) { const token = tokens[pos]; return value === undefined ? token : token === value ? token : undefined }
  /** @param {string} [value] */
  function consume(value) { const token = peek(value); if (token === undefined) throw new Error('Incomplete expression'); pos += 1; return token }
  /** @returns {number} */
  function expression() {
    let value = term()
    while (peek('+') || peek('-')) {
      const op = consume()
      const right = term()
      value = op === '+' ? value + right : value - right
    }
    return value
  }
  /** @returns {number} */
  function term() {
    let value = unary()
    while (peek('*') || peek('/')) {
      const op = consume()
      const right = unary()
      if (op === '/' && right === 0) throw new Error('Division by zero')
      value = op === '*' ? value * right : value / right
    }
    return value
  }
  /** @returns {number} */
  function unary() {
    if (peek('-')) { consume(); return -unary() }
    if (peek('+')) { consume(); return unary() }
    return power()
  }
  /** @returns {number} */
  function power() {
    const base = postfix()
    if (peek('^')) { consume(); return base ** unary() }
    return base
  }
  /** @returns {number} */
  function postfix() {
    let value = primary()
    while (peek('!') || peek('%')) {
      const op = consume()
      if (op === '%') value /= 100
      else {
        if (!Number.isInteger(value) || value < 0 || value > 170) throw new Error('Factorial needs an integer from 0 to 170')
        let result = 1
        for (let i = 2; i <= value; i += 1) result *= i
        value = result
      }
    }
    return value
  }
  /** @returns {number} */
  function primary() {
    const token = consume()
    if (/^\d*\.?\d+$/.test(token)) return Number(token)
    if (token === '(') { const value = expression(); consume(')'); return value }
    const name = token.toLowerCase()
    if (name === 'pi') return Math.PI
    if (name === 'e') return Math.E
    const unaryFns = {
      sin: (/** @type {number} */ x) => Math.sin(toRadians(x, mode)),
      cos: (/** @type {number} */ x) => Math.cos(toRadians(x, mode)),
      tan: (/** @type {number} */ x) => Math.tan(toRadians(x, mode)),
      asin: (/** @type {number} */ x) => fromRadians(Math.asin(x), mode),
      acos: (/** @type {number} */ x) => fromRadians(Math.acos(x), mode),
      atan: (/** @type {number} */ x) => fromRadians(Math.atan(x), mode),
      log: Math.log10, ln: Math.log, sqrt: Math.sqrt, abs: Math.abs, exp: Math.exp,
    }
    const fn = unaryFns[/** @type {keyof typeof unaryFns} */ (name)]
    if (!fn) throw new Error(`Unknown token: ${token}`)
    consume('(')
    const value = fn(expression())
    consume(')')
    if (!Number.isFinite(value)) throw new Error('Result is not a finite number')
    return value
  }
  const result = expression()
  if (pos !== tokens.length) throw new Error('Unexpected token')
  if (!Number.isFinite(result)) throw new Error('Result is not a finite number')
  return Object.is(result, -0) ? 0 : result
}

/** @param {number} value @param {AngleMode} mode */
function toRadians(value, mode) { return mode === 'deg' ? (value * Math.PI) / 180 : value }
/** @param {number} value @param {AngleMode} mode */
function fromRadians(value, mode) { return mode === 'deg' ? (value * 180) / Math.PI : value }

/** @param {string} input @returns {string[]} */
function tokenize(input) {
  const source = input.replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
  /** @type {string[]} */
  const tokens = []
  let index = 0
  while (index < source.length) {
    const char = source[index]
    if (/[0-9.]/.test(char)) {
      let end = index + 1
      while (end < source.length && /[0-9.]/.test(source[end])) end += 1
      const token = source.slice(index, end)
      if ((token.match(/\./g) ?? []).length > 1) throw new Error('Invalid number')
      tokens.push(token)
      index = end
      continue
    }
    if (/[a-zA-Z]/.test(char)) {
      let end = index + 1
      while (end < source.length && /[a-zA-Z]/.test(source[end])) end += 1
      tokens.push(source.slice(index, end))
      index = end
      continue
    }
    if ('+-*/^()!%'.includes(char)) { tokens.push(char); index += 1; continue }
    throw new Error(`Unsupported character: ${char}`)
  }
  if (tokens.length === 0) throw new Error('Enter an expression')
  return tokens
}

/** @param {number} value */
export function formatCalculatorResult(value) {
  if (Number.isInteger(value)) return String(value)
  return String(Number(value.toPrecision(12)))
}
