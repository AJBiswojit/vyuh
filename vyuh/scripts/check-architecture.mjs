#!/usr/bin/env node
/**
 * Architecture guard. Runs before every build and as `npm run lint`.
 *
 *  1. mock-data boundary — nothing under src/features, src/shared or src/app may
 *     import src/mock-data or src/services/mock. Data reaches a screen through a
 *     feature hook and a service, never through a fixture.
 *  2. Barrel — services/mock must import fixtures from mock-data/index.js, so the
 *     removal recipe in mock-data/README.md stays a one-line edit.
 *  3. No TypeScript files. The stack is plain JavaScript with JSDoc.
 *  4. No emoji in source. Icons come from lucide-react only.
 *  5. NO HEX OUTSIDE tokens.css — nor rgb()/hsl() literals, nor an off-brand
 *     Tailwind palette utility. Colour lives in tokens.css or it does not exist.
 *  6. One filled ember primary per view file.
 *  7. Icon-only buttons carry a label (`aria-label` or a `label` prop).
 *
 * Usage: node scripts/check-architecture.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '')
const SRC = join(ROOT, 'src')

/** Files permitted to hold colour literals. */
const COLOUR_FILES = new Set(['src/styles/tokens.css'])

/** @type {string[]} */
const failures = []

/**
 * Nav targets (from the three workspace layouts) and routes declared in the
 * router. Collected while walking files, compared once at the end: a nav item
 * that leads nowhere renders a redirect to a 404, which is a shipped bug.
 * @type {Set<string>}
 */
const navTargets = new Set()
/** @type {Set<string>} */
const routePaths = new Set()

/** @param {string} dir @returns {string[]} */
function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const files = walk(SRC)
const rel = (file) => relative(ROOT, file).split(sep).join('/')

const IMPORT_RE = /(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g

const BANNED_PALETTE =
  /\b(?:text|bg|border|from|via|to|ring|fill|stroke|outline|decoration|shadow|divide|accent|caret)-(?:purple|indigo|violet|blue|sky|pink|fuchsia|rose|teal|cyan|emerald|lime|amber|yellow|green|red|orange|slate|gray|grey|zinc|neutral|stone)(?:-\d{2,3})?\b/

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F2FF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/u

const HEX_RE = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/

for (const file of files) {
  const path = rel(file)
  const source = readFileSync(file, 'utf8')
  const isColourFile = COLOUR_FILES.has(path)

  if (/\.tsx?$/.test(path)) {
    failures.push(`${path}: TypeScript file. Use .jsx / .js with JSDoc.`)
    continue
  }

  const isPresentation =
    path.startsWith('src/features/') || path.startsWith('src/shared/') || path.startsWith('src/app/')
  const isServiceMock = path.startsWith('src/services/mock/')
  const isMockData = path.startsWith('src/mock-data/')

  // ── 1 & 2: import boundaries ─────────────────────────────────────────
  for (const match of source.matchAll(IMPORT_RE)) {
    const specifier = match[1]
    if (!specifier.startsWith('.') && !specifier.startsWith('@/')) continue

    const resolved = specifier.startsWith('@/')
      ? `src/${specifier.slice(2)}`
      : join(relative(SRC, join(file, '..')), specifier).split(sep).join('/')
    const normalised = resolved.startsWith('src/') ? resolved : `src/${resolved}`

    if (isPresentation && (normalised.includes('mock-data') || normalised.includes('services/mock'))) {
      failures.push(`${path}: presentation layer imports ${specifier}. Route it through a feature hook.`)
    }
    if (!isServiceMock && !isMockData && normalised.includes('mock-data')) {
      failures.push(`${path}: only src/services/mock may read src/mock-data (found ${specifier}).`)
    }
    if (isServiceMock && normalised.includes('mock-data/') && !normalised.endsWith('mock-data/index.js')) {
      failures.push(`${path}: import fixtures from mock-data/index.js, not ${specifier}.`)
    }
  }

  // ── 3: no TypeScript (handled above) ─────────────────────────────────
  // ── 4: no emoji ──────────────────────────────────────────────────────
  if (EMOJI_RE.test(source)) {
    failures.push(`${path}: emoji in source. Use a lucide-react icon.`)
  }

  // ── 5: colour ────────────────────────────────────────────────────────
  if (!isColourFile) {
    if (HEX_RE.test(source)) {
      failures.push(`${path}: hex colour ${HEX_RE.exec(source)?.[0]}. Colour lives in src/styles/tokens.css.`)
    }

    // Strip comments first: prose such as "rgb(var(--vyuh-…-rgb))" inside a doc
    // block is documentation, not a value.
    const withoutComments = source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/[^\n]*/g, '$1')

    // Allowed: var(--token), rgb(var(--vyuh-…-rgb) / α) and color-mix() — all of
    // which compose tokens. Not allowed: a literal rgb()/hsl()/oklch() value.
    const literals = [...withoutComments.matchAll(/\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\([^)]*/gi)].filter(
      (match) => !/^\w+\(\s*var\(--/.test(match[0]),
    )
    if (literals.length > 0) {
      failures.push(
        `${path}: colour literal ${literals[0][0].slice(0, 30)}… outside tokens.css. Use a token or var(--vyuh-…-rgb).`,
      )
    }

    if (BANNED_PALETTE.test(source)) {
      failures.push(`${path}: off-brand palette utility "${BANNED_PALETTE.exec(source)?.[0]}". Use a token.`)
    }
  }

  // ── 6: one filled ember primary per view ─────────────────────────────
  // The design preview is exempt by definition: it is the page whose job is to
  // show the rule, and it renders every variant of every primitive.
  const isSpecimenPage = path.includes('/design-preview/')
  if (path.endsWith('.jsx') && path.startsWith('src/features/') && !isSpecimenPage) {
    const emberVariants = source.match(/<Button\b[^>]*variant="primary"/gs)?.length ?? 0
    const emberSurfaces =
      source.match(/className="[^"]*\bbg-ember\b[^"]*"/g)?.filter((value) => /rounded-/.test(value) && /\bpx-/.test(value))
        .length ?? 0
    const total = emberVariants + emberSurfaces
    if (total > 1) {
      failures.push(`${path}: ${total} filled ember primaries. A view may have one.`)
    }
  }


  // ── 8: routes that are nav-reachable ─────────────────────────────────
  // A nav item pointing at a route nobody defined is the kind of gap that ships.
  // This is checked once, from the layout that owns the nav.
  if (/layouts\/(Student|Faculty|Admin)Layout\.jsx$/.test(path)) {
    for (const match of source.matchAll(/to: '([^']+)'/g)) {
      navTargets.add(match[1])
    }
  }

  // ── 7: icon-only buttons are labelled ────────────────────────────────
  for (const match of source.matchAll(/<IconButton\b/g)) {
    // Props can nest elements (`icon={...}`), so look ahead a bounded window
    // instead of trying to match a JSX element's closing tag with a regex.
    const window = source.slice(match.index, match.index + 400)
    if (!/\blabel=/.test(window)) {
      failures.push(`${path}: IconButton without a label prop near offset ${match.index}.`)
    }
  }
}

// ── Post-pass: router paths ───────────────────────────────────────────
const routeFile = 'src/app/routes/AppRoutes.jsx'
let routerSource = ''
try {
  routerSource = readFileSync(join(ROOT, routeFile), 'utf8')
} catch {
  failures.push(`${routeFile}: route table is missing.`)
}

for (const match of routerSource.matchAll(/path="([^"]+)"/g)) {
  if (match[1].startsWith('/')) routePaths.add(match[1])
}

for (const target of navTargets) {
  // `/app` is satisfied by the index route of the `/app` layout route.
  if (!routePaths.has(target)) {
    failures.push(`${target}: nav item has no matching <Route>. Add the route or drop the item.`)
  }
}

if (failures.length > 0) {
  console.error(`Architecture check failed with ${failures.length} issue(s):\n`)
  for (const failure of failures) console.error(`  ✗ ${failure}`)
  process.exit(1)
}

const colourFree = files.filter((file) => !COLOUR_FILES.has(rel(file))).length
console.log(
  `Architecture check passed: ${files.length} files, ${colourFree} colour-free, no boundary or token violations.`,
)
