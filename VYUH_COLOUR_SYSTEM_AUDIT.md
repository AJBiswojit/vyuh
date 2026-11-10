# Vyuh — Official Colour System Audit

**Scope:** the entire `vyuh/` application at commit `6999e63`
**Method:** static inspection of all 3 stylesheets, all 361 source files, the architecture guard, asset files, and `index.html`. Every value below is traced to a file and line. No files were modified.
**Date:** 2026-11-10

---

## 0. Executive summary

Vyuh does **not** have a loosely-collected palette. It has a single, declared, machine-enforced
three-colour system with a semantic status layer and a full light/dark token mirror. Colour is
declared in exactly one file — `src/styles/tokens.css` — and a build-blocking lint rule prevents
any other file from containing a hex, an `rgb()`/`hsl()` literal, or an off-brand Tailwind palette
utility.

```
$ node scripts/check-architecture.mjs
Architecture check passed: 361 files, 360 colour-free, no boundary or token violations.
```

That single line is the strongest evidence in the repository: **exactly one file in the entire
application holds a colour value, and it is `tokens.css`.**

The official identity is **Ink `#0B0D10` / Paper `#FBF8F2` / Ember `#E4572E`** at a stated 60/30/10
area ratio, plus five status colours used strictly for state, never decoration.

There is essentially **no palette drift**. What drift exists is narrow and specific: a duplicated
shell component, two parallel "paper" definitions for the landing/legal surface, one dead blue/cyan
gradient inside the logo SVG, one unused icon sprite, and one hardcoded `meta` colour outside the
guard's reach. These are catalogued in §8–§10.

> **Part II (§16–§20) adds a second pass** over every route's dark-mode behaviour, the remaining
> twelve primitives, and the exam status vocabulary. It found **one genuine systemic defect** —
> `bg-ink` used as a *component fill* collapses to 1.00:1 against the dark surface at seven sites.
> The palette itself is not at fault; see §16.

---

## 1. How colour is actually implemented

This matters for the audit, because it determines what "official" means here.

| Fact | Evidence |
|---|---|
| **No `tailwind.config.js` exists.** Tailwind v4 is configured in CSS. | `package.json` devDeps `tailwindcss ^4.3.5`, `@tailwindcss/vite ^4.3.5`; `vite.config.js` L3/L7 plugins `[react(), tailwindcss()]` |
| The theme is declared with `@theme` and `@theme inline`. | `src/styles/tokens.css` L28, L172 |
| There are exactly **three** stylesheets in the project. | `src/index.css`, `src/styles/tokens.css`, `src/features/landing/landing.css` |
| `src/index.css` contains **zero** colour literals; everything reads from tokens. | `src/index.css` L5 comment: *"Base layer. No colour literals here — everything reads from tokens.css."* |
| Light theme is `:root, [data-theme='light']`; dark is `[data-theme='dark']`. | `tokens.css` L219–220, L281 |
| Theming is attribute-driven, not class-driven. No `dark:` variants exist anywhere. | `grep -rhoE 'dark:[a-z0-9-]+' src` → **0 results**; `ThemeProvider.jsx` L68 `root.dataset.theme = resolved` |
| Only one file may hold a colour. Enforced at build time. | `scripts/check-architecture.mjs` L26 `COLOUR_FILES = new Set(['src/styles/tokens.css'])`, rule 5 at L104–130; runs in `npm run build` and `npm run lint` |
| Charts resolve colour at runtime from computed CSS vars, not by duplicating hex. | `src/shared/lib/chartTokens.js` L27–39 |

**33 unique colour values** exist in the whole system (72 hex occurrences in `tokens.css`, reduced to
33 unique by case-variant repeats such as `#E4572E`/`#e4572e`).

Because every component composes tokens rather than values, **the palette is not a convention that
can drift — it is a build artifact.** That is why the answer to "are there conflicting definitions?"
is largely "no", and the answer to "do pages bypass the tokens?" is "only two, both outside `src/`".

---

## 2. The core palette — the three primaries

Declared `tokens.css` L30–38. This is the **official** system, and it is stated in the file's own
header (L6–9) and repeated in `README.md` L63–64:

> **THREE COLOUR SUPREMACY** — Ink `#0B0D10` structure 60% · Paper `#FBF8F2` surface 30% · Ember `#E4572E` signal 10%

| Role | Token | HEX | Notes |
|---|---|---|---|
| **Ink** (structure) | `--color-ink` | **`#0B0D10`** | Rail, hero, dark panels, text on paper. Deep blue-black, not pure black. |
| Ink raised | `--color-ink-raised` | `#15181D` | Panel sitting on ink |
| Ink sunken | `--color-ink-sunken` | `#07080A` | Well on ink |
| **Paper** (surface) | `--color-paper` | **`#FBF8F2`** | App background, reading areas. Warm off-white, not pure white. |
| Paper raised | `--color-paper-raised` | `#FFFFFF` | Card on paper |
| Paper sunken | `--color-paper-sunken` | `#F1ECE2` | Recessed panel |
| **Ember** (signal) | `--color-ember` | **`#E4572E`** | Primary action, focus ring, current question |
| Ember press | `--color-ember-press` | `#C7461F` | Pressed state, and ember-as-text (AA-safe) |
| Ember wash | `--color-ember-wash` | `#FBE9E3` | Disabled fill and selected tint |

Ink-on-signal pairs (`tokens.css` L68–69):

| Token | HEX |
|---|---|
| `--color-on-signal` | `#0B0D10` |
| `--color-on-signal-inverse` | `#FBF8F2` |

> Note these are value-identical to Ink and Paper. They are **semantic aliases, not new colours** —
> deliberately duplicated so "text on a filled status chip" cannot accidentally become a theme-dependent value.

---

## 3. The status palette (semantic, never decorative)

Declared `tokens.css` L40–57. Each status ships **three** values: a fill, an AA-legible text variant
on paper (`-deep`), and an AA-legible text variant on ink (`-soft`). The file's rule (L17–19) is that
a semantic colour *"never becomes a section background and never decorates a card."*

| Status | Fill | Text on paper (`-deep`) | Text on ink (`-soft`) |
|---|---|---|---|
| **Answered / correct / present** | `--color-lichen` **`#5FA777`** | `#2F6A46` (6.06:1) | `#8FC7A2` |
| **Review / warning** | `--color-marigold` **`#F2B33D`** | `#7D5306` (6.37:1) | `#F6CD80` |
| **Wrong / absent / danger** | `--color-oxblood` **`#B23A48`** | `#8C2733` (8.08:1) | `#E4919B` |
| **Live / info** | `--color-glacier` **`#7CC4D9`** | `#1B6478` (6.31:1) | `#A3D7E6` |
| **Muted / not visited** | `--color-dust` **`#A8A195`** | `#6B6459` (5.51:1) | `#C2BCB1` |

**(Contrast ratios above were recomputed from the HEX values; all pass WCAG AA 4.5:1.)**

### The alias layer that production actually consumes

`tokens.css` L195–204 declares theme-aware aliases, re-declared per theme at L239–249 and L300–310:

| Component-facing token | → Palette colour |
|---|---|
| `--color-answer` / `--color-answer-fg` | Lichen `#5FA777` / `#2F6A46` light · `#8FC7A2` dark |
| `--color-review` / `--color-review-fg` | Marigold `#F2B33D` / `#7D5306` light · `#F6CD80` dark |
| `--color-danger` / `--color-danger-fg` | Oxblood `#B23A48` / `#8C2733` light · `#E4919B` dark |
| `--color-info` / `--color-info-fg` | Glacier `#7CC4D9` / `#1B6478` light · `#A3D7E6` dark |
| `--color-idle` / `--color-idle-fg` | Dust `#A8A195` / `#6B6459` light · `#A8A195` dark |

**Important distinction for your brief:** there are **no tokens named `success`, `warning`, `error`,
or `info`** (except `info`). `grep success\|warning\|error src/styles/tokens.css` returns only one hit —
the word "warning" inside a comment at L13. The system expresses these states through
**answer / review / danger / info / idle**, i.e. exam-domain language rather than generic UI
language. Mapping to your requested table is therefore interpretive, and I have stated it explicitly
in §12 rather than inventing tokens that do not exist.

---

## 4. Text, border and surface ramps (theme-resolved)

These are `--vyuh-*` values, mirrored per theme. They are the values components actually paint with.

### Light theme — Paper surface, Ink text (`tokens.css` L251–277)

| Token | HEX / value | Measured contrast | Used for |
|---|---|---|---|
| `--vyuh-surface` | **`#FBF8F2`** | — | page background |
| `--vyuh-surface-raised` | **`#FFFFFF`** | — | card |
| `--vyuh-surface-sunken` | `#F1ECE2` | — | recessed panel |
| `--vyuh-surface-inverse` | `#0B0D10` | — | inverse panel |
| `--vyuh-text-strong` | **`#0B0D10`** | 18.4:1 (claimed 17.9) | headings |
| `--vyuh-text` | **`#24272C`** | 14.1:1 ✓ | body |
| `--vyuh-text-muted` | **`#5D5A52`** | 6.5:1 ✓ | secondary text |
| `--vyuh-text-faint` | **`#6E685C`** | 5.2:1 ✓ | mono labels, meta |
| `--vyuh-text-inverse` | `#FBF8F2` | — | text on inverse |
| `--vyuh-text-on-ember` | `#1A0D08` | 5.16:1 ✓ | text on Ember |
| `--vyuh-border` | `rgb(11 13 16 / 0.12)` | — | hairline |
| `--vyuh-border-strong` | `rgb(11 13 16 / 0.24)` | — | strong rule |
| `--vyuh-scrim` | `rgb(11 13 16 / 0.55)` | — | dialog overlay |

### Dark theme — Ink surface, Paper text (`tokens.css` L312–338)

| Token | HEX / value | Measured contrast |
|---|---|---|
| `--vyuh-surface` | **`#0B0D10`** | — |
| `--vyuh-surface-raised` | **`#15181D`** | — |
| `--vyuh-surface-sunken` | `#07080A` | — |
| `--vyuh-surface-inverse` | `#FBF8F2` | — |
| `--vyuh-text-strong` | **`#FBF8F2`** | 18.9:1 |
| `--vyuh-text` | **`#E8E4DB`** | 15.3:1 ✓ |
| `--vyuh-text-muted` | **`#A8A195`** | 7.6:1 ✓ |
| `--vyuh-text-faint` | **`#8B857A`** | 5.3:1 ✓ |
| `--vyuh-text-on-ember` | `#1A0D08` | — |
| `--vyuh-border` | `rgb(251 248 242 / 0.14)` | — |
| `--vyuh-border-strong` | `rgb(251 248 242 / 0.28)` | — |
| `--vyuh-scrim` | `rgb(7 8 10 / 0.72)` | — |

**Ember is deliberately identical in both themes** — the complete core trio does not shift hue,
only the surface/text aliases invert.

### Paper-on-ink text ramp (`tokens.css` L77–86)

For ink surfaces that stay ink in both themes (the rail), a five-step alpha ladder of Paper:

| Token | Value | Contrast on Ink |
|---|---|---|
| `--color-on-ink-strong` | `rgb(251 248 242 / 0.86)` | 13.5:1 |
| `--color-on-ink` | `rgb(251 248 242 / 0.74)` | 9.6:1 |
| `--color-on-ink-muted` | `rgb(251 248 242 / 0.66)` | 8.2:1 |
| `--color-on-ink-faint` | `rgb(251 248 242 / 0.56)` | 6.2:1 |
| `--color-on-ink-label` | `rgb(251 248 242 / 0.52)` | 5.4:1 |

Plus washes at `0.09` / `0.05` / `0.16` for hover and selected rows.

### Theme-independent hairlines (`tokens.css` L208–210)

| Token | Value | Purpose |
|---|---|---|
| `--color-hairline-on-ink` | `rgb(251 248 242 / 0.14)` | rule on ink, any theme |
| `--color-hairline-on-ink-strong` | `rgb(251 248 242 / 0.28)` | strong rule on ink |
| `--color-hairline-on-paper` | `rgb(11 13 16 / 0.12)` | rule on paper, any theme |

---

## 5. The "cinema" layer — second, parallel neutral set

This is the one genuine colour duplication in the project. `tokens.css` L63–65:

| Token | HEX | Where used |
|---|---|---|
| `--color-cinema-ink` | **`#0D0D0F`** | Landing `--lg-*` aliases, `index.html` meta |
| `--color-cinema-paper` | **`#F5F4F0`** | Landing `--lg-*` aliases, `StaticProsePages` |
| `--color-cinema-grey` | **`#8B8B90`** | `StaticProsePages` only |

These are **not** the same values as Ink (`#0B0D10`) and Paper (`#FBF8F2`) — they are cooler and
flatter. So the repository ships **two near-identical official neutrals**, used for different
surfaces:

- **Ink/Paper** → the application (auth, student, faculty, admin, exam)
- **cinema-ink/cinema-paper** → the landing page and the standalone legal prose pages

The landing stylesheet is explicit that this is a deliberate second palette, not drift
(`landing.css` L104–118): *"The cinema concept shipped with a fixed two-paper scheme."* It then
composes only token channels (`--vyuh-cinema-*-rgb`) into a `--lg-*` alias set, so it still contains
no literals of its own.

---

## 6. Gradients — the honest answer

**Vyuh has no decorative multi-colour gradients.** There is no `from-purple via-pink to-orange`
anywhere; the lint rule bans off-brand palette utilities outright
(`check-architecture.mjs` L54–57 `BANNED_PALETTE` covers purple, indigo, violet, blue, sky, pink,
fuchsia, rose, teal, cyan, emerald, lime, amber, yellow, green, red, orange, slate, gray, zinc,
neutral, stone).

Every gradient that exists is one of four kinds:

### 6.1 The official brand gradient (the only true two-stop gradient)

`src/shared/ui/Logo.jsx` L45–54, L91–101. The mark is a graded fill whose stops are composed from
tokens via `color-mix` — no literals. Resolved to HEX:

| Surface | Start | End | Render |
|---|---|---|---|
| **On Ink** (`tone="paper"`) | `#FBF8F2` (Paper) | `#B8B6B3` | warm near-white → warm grey |
| **On Paper** (`tone="ink"`) | `#0B0D10` (Ink) | `#545658` | blue-black → slate grey |

This is the official gradient combination: **Paper→`#B8B6B3`** on dark surfaces,
**Ink→`#545658`** on light surfaces. It is monochrome by design — the mark reads as typography,
not as a logo colour.

### 6.2 Ember text derivatives (AA-safe mixes)

`landing.css` L142, L168:

| Context | Expression | Resolved HEX |
|---|---|---|
| Light theme | `color-mix(in srgb, Ember 82%, Ink)` | **`#BD4A29`** |
| Dark theme | `color-mix(in srgb, Ember 78%, Paper)` | **`#E97A59`** |

These exist because Ember as small text fails AA on paper; the mix deepens it (light) or lifts it
(dark) while staying recognisably Ember. No new hex is introduced.

### 6.3 Alpha washes over media (hero scrims)

`landing.css` L140–141 (light) and L166–167 (dark) — single-hue alpha ramps used as image
scrims, not as colour:

- **Desktop:** `linear-gradient(100deg, paper 0.95 → 0.74 @34% → 0.10 @62% → 0 @78%)`
- **Mobile:** `linear-gradient(180deg, paper 0.18 → 0.10 @26% → 0.40 @48% → 0.88 @66% → 0.96 @100%)`
- **Dark equivalents:** identical geometry over `cinema-ink` at `0.94 / 0.72 / 0.08 / 0` and
  `0.30 / 0.12 / 0.42 / 0.90 / 0.97`

### 6.4 Structural gradients (rules, not decoration)

- `index.css` L129, L133 — `.hairline-columns` / `.hairline-columns-on-ink`: a 1px rule repeated at 25% intervals to draw column structure.
- `index.css` L149, L168 — skeleton shimmer: a transparent → body-7% → transparent sweep.
- `landing.css` L415–418 — presence ping: a box-shadow ring expanding from `ink/0.35` to transparent.

**Verdict:** the gradient vocabulary is entirely alpha-based and single-hue, plus one monochrome
brand gradient. There is **no** multi-hue gradient anywhere in the shipped UI.

---

## 7. Which colours are used most frequently?

Measured across 2796 colour-utility usages in all `.jsx`/`.js` files
(`bg-*`, `text-*`, `border-*`, `ring-*`, `fill-*`, `stroke-*`, `from-*`, `via-*`, `to-*`, `divide-*`, `outline-*`):

| Rank | Token | Uses | Share | Resolved (light) |
|---|---|---|---|---|
| 1 | `heading` | 531 | **19.0%** | `#0B0D10` |
| 2 | `muted` | 458 | **16.4%** | `#5D5A52` |
| 3 | `line` | 399 | **14.3%** | `rgb(11 13 16 / 0.12)` |
| 4 | `faint` | 229 | 8.2% | `#6E685C` |
| 5 | `line-strong` | 131 | 4.7% | `rgb(11 13 16 / 0.24)` |
| 6 | `surface-raised` | 120 | 4.3% | `#FFFFFF` |
| 7 | `body` | 117 | 4.2% | `#24272C` |
| 8 | `surface-sunken` | 116 | 4.1% | `#F1ECE2` |
| 9 | **`ember`** | 80 | **2.9%** | `#E4572E` |
| 10 | `ember-press` | 61 | 2.2% | `#C7461F` |
| 11 | `danger-fg` | 61 | 2.2% | `#8C2733` |
| 12 | `hairline-on-ink` | 43 | 1.5% | `rgb(251 248 242 / 0.14)` |
| 13 | `paper` | 42 | 1.5% | `#FBF8F2` |
| 14 | `ink` | 34 | 1.2% | `#0B0D10` |

**Reading this honestly:** the dominant colours are *neutrals used as typography and structure* —
heading + muted + body + faint = **47.8%** of every colour decision in the app, and the three
line/hairline tokens add another **19.0%**. Ember, the accent, appears in only **5.1%** of usages
(`ember` + `ember-press`), which is exactly the 10%-or-less "signal" budget the system declares —
and in practice it lands closer to 5%.

This is why the product reads as editorial rather than branded-colour-led: **~67% of the colour
surface is warm paper, blue-black ink, and hairlines.**

---

## 8. Is the colour system consistent across all three roles?

**Yes — structurally, and by construction rather than by convention.**

The three role layouts resolve to one shared shell:

| Role | Layout file | Base |
|---|---|---|
| Student | `src/app/layouts/StudentLayout.jsx` L30 | `StudentShell` |
| Faculty | `src/app/layouts/FacultyLayout.jsx` | `WorkspaceLayout` |
| Admin | `src/app/layouts/AdminLayout.jsx` L60–68 | `WorkspaceLayout` |

Both shells paint the identical structure:

- Rail: `border-r border-hairline-on-ink bg-ink text-paper` — `WorkspaceLayout.jsx` L65, `StudentShell.jsx` L100
- Active nav marker: `bg-ember` 2px bar — `WorkspaceLayout.jsx` L123; `StudentShell.jsx` L178 uses `bg-ember` as the mobile underline
- Header: `border-b border-line bg-[color-mix(in_oklab,var(--color-surface)_92%,transparent)] backdrop-blur-[2px]` — `WorkspaceLayout.jsx` L156
- Avatar chip: `bg-ink text-paper` — `WorkspaceLayout.jsx` L171

**Critically, role is never encoded by hue.** There is no "student is blue, faculty is green,
admin is purple" — the anti-pattern this system explicitly rejects
(`DesignPreviewPage.jsx` L650 lists "Purple or indigo gradients" and L655 "Pastel dashboard palettes"
as rejected). Roles differ by **navigation content only**, and they share one palette.

Per-area accent density (all Ember, no local accent colour):

| Area | `ember` hits | Files |
|---|---|---|
| `features/admin` | 76 | 25 |
| `features/landing` | 62 | 16 |
| `features/faculty` | 44 | 36 |
| `features/live` | 33 | 21 |
| `features/student` | 19 | 22 |
| `features/exam` | 14 | 26 |
| `features/analysis` | 13 | 17 |
| `features/auth` | 7 | 19 |
| `features/learning` | 7 | 20 |

The dashboard pages confirm restraint rather than divergence: `StudentHomePage.jsx` contains only
4 colour utilities (it delegates to card components), `AdminDashboardPage.jsx` introduces no colour
beyond `heading`/`muted`/`faint`/`line`/`line-strong`/`ember-press`, and `FacultyDashboardPage.jsx`
adds `review-fg` and `danger-fg` for genuine status.

**One consistency caveat (§9.2):** the student shell is a *separate implementation* of the same
design. The colours agree today; nothing enforces that they keep agreeing tomorrow.

---

## 9. Conflicting or duplicated colour definitions

These are the only real findings. None of them break the palette; all of them are worth knowing.

### 9.1 Two parallel neutral pairs (the main duplication)

`tokens.css` L30–35 vs L63–65:

| Application | Landing / legal | Delta |
|---|---|---|
| Ink `#0B0D10` | cinema-ink `#0D0D0F` | R+2, G+0, B−1 |
| Paper `#FBF8F2` | cinema-paper `#F5F4F0` | R−6, G−4, B−2 |

Two names, two values, same job. Justified in comments as an intentional second concept, but from a
design-system standpoint this is **duplicated intent**, and it visibly changes page warmth between
`/` and `/login`.

### 9.2 `StudentShell` duplicates `WorkspaceLayout`

- `src/app/layouts/WorkspaceLayout.jsx` — 334 lines
- `src/features/student/components/StudentShell.jsx` — 205 lines

Same rail, same header, same tokens, re-written. Student chrome also carries an extra mobile tab
bar (`StudentShell.jsx` L175) and popovers that the shared shell lacks. **Colour is identical; the
implementation is forked.** Any future rail change must be made twice.

### 9.3 Two `ThemeToggle` implementations with different visuals

| File | Active-state treatment |
|---|---|
| `src/shared/ui/ThemeToggle.jsx` L31, L52–53 | `bg-surface-raised text-heading` — neutral raised cell |
| `src/features/landing/components/ThemeToggle.jsx` (via `landing.css` L254–257) | `color = ember`, `background = ember @12%` — ember-tinted |

So the *same control* is neutral inside the app and ember-tinted on the landing page. Defensible
(the landing has no primary button competing), but it is two definitions of one affordance.

### 9.4 `on-signal` / `on-signal-inverse` duplicate Ink / Paper

`tokens.css` L68–69 set `--color-on-signal: #0B0D10` and `--color-on-signal-inverse: #FBF8F2` —
the same values as Ink and Paper. **This is intentional and correct** (it prevents "text on a filled
chip" from inverting with the theme), but it does mean the palette ledger shows 33 unique values
where a naive reading expects 31.

### 9.5 Case inconsistency inside the single colour file

`#E4572E` and `#e4572e`, `#0B0D10` and `#0b0d10`, `#FBF8F2` and `#fbf8f2` both appear in
`tokens.css`. Cosmetically untidy only — same colour, and one is the `@theme` utility declaration
while the other is a `--vyuh-*` value.

### 9.6 `ember-wash` carries two meanings

`#FBE9E3` is used as **disabled fill** (`Button.jsx` L43) *and* as **selected/active tint**
(`AccountPage.jsx` L82, `DeviceBar.jsx` L34, `SceneManager.jsx` L32, `SlidesPanel.jsx` L43,
`StudioShell.jsx` L250, `QuestionPanel.jsx` L58). Selected and disabled therefore share a colour —
the label and shape carry the difference.

### 9.7 Documentation drift (not a colour conflict)

`tokens.css` L73 claims the ink surfaces are *"rail, hero, exam header."* The rail is ink
(`WorkspaceLayout.jsx` L65) ✓, but the exam header is **not** — `ExamHallHeader.jsx` L8 uses
`bg-surface-raised`, and `ExamHallPage.jsx` L112/L127/L139 use `bg-surface` / `bg-surface-raised`.
The exam hall is themed paper, not ink. The comment is stale; the code is coherent.

---

## 10. Pages using hardcoded colours instead of shared tokens

Only **two** files bypass the token pipeline, and both sit outside the lint guard (which walks
`src/` only — `check-architecture.mjs` L23 `const SRC = join(ROOT, 'src')`).

### 10.1 `index.html` L32 — hardcoded `#f5f4f0`

```html
<meta name="theme-color" content="#f5f4f0" />
```

This is `cinema-paper`, duplicated as a literal in HTML. The inline script above it (L20–27) does
the right thing — it resolves `--color-cinema-ink` / `--color-cinema-paper` at runtime — so this
static value is only the pre-hydration fallback. Minor, but it is the one genuinely hardcoded colour
in the shipped app shell, and it is invisible to `npm run lint`.

### 10.2 `src/features/system/pages/StaticProsePages.jsx` — pinned to light

`L11` `bg-cinema-paper text-cinema-ink`, `L13/L22` `text-cinema-ink`, `L16/L21/L44/L70`
`text-cinema-grey`, `L23` `text-cinema-ink/85`.

These are tokens (so the lint passes), but they are **the non-theming ones**. `cinema-paper` is a
fixed `#F5F4F0` that does not change under `[data-theme='dark']`. Verified: the file contains
**0** occurrences of `data-theme` or `dark:`. **Consequence: `/about` and `/privacy` stay bright
off-white while the entire application around them is dark** — the only genuine dark-mode break in
the product.

It also uses `text-cinema-ink/85` (an ad-hoc 85% opacity) instead of the defined text ramp —
the one place in the codebase where a muted-text value is invented inline rather than read from the
five-step Paper-on-Ink ladder.

### 10.3 `public/favicon.svg` — duplicated literals, correct values

Contains `#0B0D10`, `#E4572E`, `#FBF8F2` — exactly the three brand values, hardcoded in an asset
where a token cannot reach. Acceptable, but it is now a fourth place the trio must be kept in sync.

### 10.4 Everything else: clean

No component anywhere in `src/` contains a hex, an `rgb()`/`hsl()`/`oklch()` literal, or a stock
Tailwind colour utility. Verified by direct grep (0 results outside `tokens.css`) and by the guard.

---

## 11. Legacy and unused colours

Your brief asked me to separate the implemented palette from anything unused or legacy. Findings:

### 11.1 The blue/cyan logo gradient — DEAD CODE (important)

`public/logo/Vyuh_medixo.svg` defines a blue→cyan gradient:

```
linearGradient10:  #1453DD  →  #60D4F8      (blue → cyan)
```

**It is never applied to any path.** The file's only painted fill references are:

```
$ grep -oE 'fill:url\(#[a-zA-Z0-9]+\)|url\(#linearGradient[0-9]+\)' public/logo/Vyuh_medixo.svg
      2 fill:url(#linearGradient2)
$ grep -c "linearGradient11" public/logo/Vyuh_medixo.svg
1          # the id declaration itself, nothing references it
```

The visible mark paints `linearGradient2`, which is the neutral `#F9F9F9 → #E6E6E6` ramp. On the
landing page it is further neutralised by `.logo-img { filter: invert(1) }` (`landing.css` L176),
turning it into a near-black mark on paper (`#060606 → #191919`).

**So `#1453DD` and `#60D4F8` are legacy Inkscape leftovers in a `href`-orphaned `<defs>` block —
not part of Vyuh's identity and not visible to any user.** Worth deleting; worth *not* mistaking for
a brand colour if you audit the SVG naively. (The same file also carries `#F9F9F9`/`#E6E6E6`, which
are legacy too — the React `<Logo>` deliberately replaces them with token stops.)

### 11.2 `public/icons.svg` — unused asset with off-palette purple

An 8-symbol social sprite, referenced by nothing (`grep -rn "icons.svg" src index.html` → no
results). It contains `#08060D` (near-black, not Ink) and **`#AA3BFF` (violet)**. Dead weight.

### 11.3 The raw palette names are catalogue-only

`lichen`, `marigold`, `oxblood`, `glacier`, `dust` and their `-deep`/`-soft` variants are referenced
**exactly once each**, and only in the design-preview catalogue:

```
src/features/design-preview/pages/DesignPreviewPage.jsx:71-75
```

Production code never names them; it uses `answer/review/danger/info/idle`. This is a good sign —
the raw palette is an implementation detail, the aliases are the API — but it means if you read only
the palette block you will overestimate how "present" those colours are. `dust-soft` (`#C2BCB1`) has
**no production use at all**.

### 11.4 `cinema-grey` is single-purpose

`#8B8B90` appears only in `StaticProsePages.jsx` (4 times). It is not used by the landing page at all
despite living in the same token group.

### 11.5 No unused core tokens

Every `--color-*` token in `tokens.css` is referenced at least once in `src/`. There are no orphaned
Ink/Paper/Ember variants.

---

## 12. The requested palette, resolved

Two values need a stated reading, so I am being explicit rather than silently picking:

- **"Primary"** — the system's own doctrine makes **Ink the primary structural colour (60% of area)**
  and **Ember a 10% accent**. Because a "primary colour" question usually means *the brand/action
  colour*, I give **both**, labelled, rather than collapsing them and misleading you.
- **Success/Warning/Error/Info** — these names **do not exist** as tokens. The equivalents are
  `answer`/`review`/`danger`/`info`. This is a mapping, not a quote.

| Requested slot | Value | HEX | Source |
|---|---|---|---|
| **Primary colour** | **Ink** (structural, 60%) | **`#0B0D10`** | `tokens.css` L30 |
| **Primary — action/accent** | **Ember** (signal, 10%) | **`#E4572E`** | `tokens.css` L36 |
| **Secondary colour** | **Paper** (surface, 30%) | **`#FBF8F2`** | `tokens.css` L33 |
| **Accent colour** | **Ember** | **`#E4572E`** | `tokens.css` L36 (pressed `#C7461F`) |
| **Main background** | light | **`#FBF8F2`** | `tokens.css` L251 |
| | dark | **`#0B0D10`** | `tokens.css` L312 |
| **Surface / card** | light raised | **`#FFFFFF`** | `tokens.css` L252 |
| | dark raised | **`#15181D`** | `tokens.css` L313 |
| **Primary text** | light (headings) | **`#0B0D10`** | `tokens.css` L257 |
| | light (body) | **`#24272C`** | `tokens.css` L256 |
| | dark | **`#FBF8F2`** / body `#E8E4DB` | `tokens.css` L317–318 |
| **Secondary text** | light `muted` | **`#5D5A52`** | `tokens.css` L258 |
| | light `faint` | **`#6E685C`** | `tokens.css` L259 |
| | dark `muted` | **`#A8A195`** | `tokens.css` L319 |
| **Border** | light | **`rgba(11,13,16,0.12)`** → `#0B0D10` @12% | `tokens.css` L263 |
| | light strong | `rgba(11,13,16,0.24)` | `tokens.css` L264 |
| | dark | **`rgba(251,248,242,0.14)`** | `tokens.css` L324 |
| | dark strong | `rgba(251,248,242,0.28)` | `tokens.css` L325 |
| **Success** *(=`answer`)* | fill | **`#5FA777`** | `tokens.css` L40 |
| | text light / dark | `#2F6A46` / `#8FC7A2` | L47 / L53 |
| **Warning** *(=`review`)* | fill | **`#F2B33D`** | `tokens.css` L41 |
| | text light / dark | `#7D5306` / `#F6CD80` | L48 / L54 |
| **Error** *(=`danger`)* | fill | **`#B23A48`** | `tokens.css` L42 |
| | text light / dark | `#8C2733` / `#E4919B` | L49 / L55 |
| **Info** *(=`info`)* | fill | **`#7CC4D9`** | `tokens.css` L43 |
| | text light / dark | `#1B6478` / `#A3D7E6` | L50 / L56 |
| **Idle / muted** *(bonus)* | fill | **`#A8A195`** | `tokens.css` L44 |
| | text light / dark | `#6B6459` / `#A8A195` | L51 / L57 |
| **Gradient — brand** | on ink | **`#FBF8F2 → #B8B6B3`** | `Logo.jsx` L46–49 |
| | on paper | **`#0B0D10 → #545658`** | `Logo.jsx` L50–53 |
| **Gradient — ember text** | light | **`#BD4A29`** | `landing.css` L142 |
| | dark | **`#E97A59`** | `landing.css` L168 |
| **Gradient — hero scrim** | single-hue alpha only | Paper/Ink @ .95→0 | `landing.css` L140–141, L166–167 |
| **Cinema neutrals** | ink / paper / grey | `#0D0D0F` / `#F5F4F0` / `#8B8B90` | `tokens.css` L63–65 |

---

## 13. Overall visual identity

The palette is not a "dashboard palette". It is an **editorial, print-derived exam-hall identity**,
and the colours are only one third of it:

1. **Warm paper + blue-black ink, never white + black.** Paper `#FBF8F2` is warm; Ink `#0B0D10` is a
   deep blue-black. The interface is built to feel like a well-printed examination booklet.
2. **A single vermilion signal, spent sparingly.** Ember `#E4572E` occupies ~5% of colour usages and
   is reserved for: the one primary action per view (enforced by lint rule 6,
   `check-architecture.mjs` L131–149), the focus ring (one global 2px Ember rule, `index.css` L65–69),
   the current question, and the active nav marker. It is never a section background.
3. **Status is triply encoded.** Colour + shape + word: filled square = answered, diamond = review,
   ring-with-cut = wrong, circle = live, hollow = not visited (`Badge.jsx` L7–13, L70–111). This is
   why the status palette can afford to be low-chroma — it never has to carry meaning alone.
4. **Structure is drawn with hairlines, not shadows.** Shadows exist only on floating layers
   (`tokens.css` L154–156). Cards are hairline-bounded plates (`Card.jsx` L4–6), explicitly rejecting
   "rounded-2xl + drop shadow".
5. **Three typefaces with three jobs.** Fraunces (display, serif, WONK on), Bricolage Grotesque (UI,
   variable weight), JetBrains Mono (all numerals, labels, IDs — tabular by default,
   `index.css` L54–62). Mono labels in uppercase with 0.12em tracking are the product's signature voice.
6. **Two papers, alternating.** The landing page runs ink sections against paper sections
   (`tokens.css` L60–62) — cinema-ink `#0D0D0F` / cinema-paper `#F5F4F0`, slightly cooler than the
   app's ink/paper to read as "film" rather than "document".

The closest accurate descriptor: **a print-inspired, warm-neutral academic interface with a single
vermilion accent and a shape-encoded status language.**

---

## 14. Vyuh Official Colour System — Current Implementation

*Consolidated table. All values verified against source. "Alias" rows are the tokens production code
actually consumes.*

### Core trio

| # | Role | Token | HEX | Area budget | Evidence |
|---|---|---|---|---|---|
| 1 | **Primary — structure** | `--color-ink` | **`#0B0D10`** | 60% | tokens.css L30 |
| 2 | **Secondary — surface** | `--color-paper` | **`#FBF8F2`** | 30% | tokens.css L33 |
| 3 | **Accent / signal** | `--color-ember` | **`#E4572E`** | 10% | tokens.css L36 |

### Ink & Paper variants

| Role | Token | HEX | Evidence |
|---|---|---|---|
| Ink raised | `--color-ink-raised` | `#15181D` | L31 |
| Ink sunken | `--color-ink-sunken` | `#07080A` | L32 |
| Paper raised | `--color-paper-raised` | `#FFFFFF` | L34 |
| Paper sunken | `--color-paper-sunken` | `#F1ECE2` | L35 |
| Ember pressed | `--color-ember-press` | `#C7461F` | L37 |
| Ember wash | `--color-ember-wash` | `#FBE9E3` | L38 |

### Status (semantic)

| State | Fill | Text on paper | Text on ink | Evidence |
|---|---|---|---|---|
| Answer / success / present | `#5FA777` | `#2F6A46` | `#8FC7A2` | L40, L47, L53 |
| Review / warning | `#F2B33D` | `#7D5306` | `#F6CD80` | L41, L48, L54 |
| Danger / error / absent | `#B23A48` | `#8C2733` | `#E4919B` | L42, L49, L55 |
| Info / live | `#7CC4D9` | `#1B6478` | `#A3D7E6` | L43, L50, L56 |
| Idle / not visited | `#A8A195` | `#6B6459` | `#A8A195` | L44, L51, L57 |

### Text & borders (theme-resolved)

| Role | Light | Dark | Evidence |
|---|---|---|---|
| Heading | `#0B0D10` | `#FBF8F2` | L257, L318 |
| Body | `#24272C` | `#E8E4DB` | L256, L317 |
| Muted (secondary text) | `#5D5A52` | `#A8A195` | L258, L319 |
| Faint (labels / meta) | `#6E685C` | `#8B857A` | L259, L320 |
| Text on Ember | `#1A0D08` | `#1A0D08` | L261, L322 |
| Border | `rgba(11,13,16,.12)` | `rgba(251,248,242,.14)` | L263, L324 |
| Border strong | `rgba(11,13,16,.24)` | `rgba(251,248,242,.28)` | L264, L325 |
| Scrim | `rgba(11,13,16,.55)` | `rgba(7,8,10,.72)` | L277, L338 |
| On-ink ladder | `.86 / .74 / .66 / .56 / .52` of Paper | same | L77–81 |

### Second neutral set (landing + legal)

| Role | Token | HEX | Evidence |
|---|---|---|---|
| Cinema ink | `--color-cinema-ink` | `#0D0D0F` | L63 |
| Cinema paper | `--color-cinema-paper` | `#F5F4F0` | L64 |
| Cinema grey | `--color-cinema-grey` | `#8B8B90` | L65 |
| On signal | `--color-on-signal` | `#0B0D10` | L68 |
| On signal inverse | `--color-on-signal-inverse` | `#FBF8F2` | L69 |

### Gradients

| Purpose | Values | Evidence |
|---|---|---|
| Brand mark on ink | `#FBF8F2 → #B8B6B3` | Logo.jsx L46–49 |
| Brand mark on paper | `#0B0D10 → #545658` | Logo.jsx L50–53 |
| Ember text, light | `#BD4A29` (82% Ember + Ink) | landing.css L142 |
| Ember text, dark | `#E97A59` (78% Ember + Paper) | landing.css L168 |
| Hero scrim, desktop | Paper `0.95→0.74→0.10→0` @100° | landing.css L140 |
| Hero scrim, mobile | Paper `0.18→0.10→0.40→0.88→0.96` @180° | landing.css L141 |
| Hero scrim, dark | Ink `0.94→0.72→0.08→0` | landing.css L166 |
| Structural rules | hairline repeats @25%, skeleton sweep | index.css L129–168 |

**Total: 33 unique colour values in the official system.**

---

## 15. Recommendation — retain, then standardise

**Recommendation: RETAIN the palette. Do not redesign it. Standardise the four duplications around
it.**

### Why retain

1. **It is already a design system, not a colour list.** One file, 33 values, machine-enforced,
   with a per-theme alias layer and measured contrast. Palettes at this level of discipline are
   usually the *result* of standardisation, not a candidate for it.
2. **It is genuinely distinctive.** Warm paper `#FBF8F2` + blue-black ink `#0B0D10` + vermilion
   `#E4572E` is not a template palette. Replacing it with "modern SaaS blue" would destroy the only
   thing that makes Vyuh visually identifiable.
3. **It is accessible by measurement, not assertion.** I recomputed every claimed ratio: body
   14.13:1, muted 6.50:1, faint 5.22:1, on-ember 5.16:1, ember-press 4.58:1, all status text
   variants 5.51–8.08:1. All pass AA. The only discrepancy is headings at 18.36:1 vs a claimed
   17.9:1 — conservative, harmless.
4. **The status language is better than a generic one.** `answer / review / danger / info / idle`
   with three encodings (colour, shape, word) is stronger than `success / warning / error / info`
   with one. Adopting generic names would be a downgrade.

### What to standardise (in priority order)

| # | Issue | Action | Risk if ignored |
|---|---|---|---|
| 1 | `StaticProsePages.jsx` is pinned to `cinema-paper` and ignores dark mode (§10.2) | Point `/about` and `/privacy` at `bg-surface text-body` + the text ramp | **High** — the only visible dark-mode break in the product |
| 2 | Two neutral pairs, `#0B0D10`/`#0D0D0F` and `#FBF8F2`/`#F5F4F0` (§9.1) | Either alias cinema → Ink/Paper, or document the delta as a deliberate "film" grade in `tokens.css` and adopt it in `StaticProsePages` | Medium — page warmth shifts between `/` and `/login` for no stated reason |
| 3 | `StudentShell` forks `WorkspaceLayout` (§9.2) | Fold the student chrome into the shared shell via slots, or declare the fork intentional in a comment | Medium — the rail must now be edited twice; will silently diverge |
| 4 | Two `ThemeToggle`s with different active treatments (§9.3) | Adopt the shared primitive on the landing page with an `onInk`/`accent` variant | Low — visual inconsistency in one control |
| 5 | `index.html` L32 hardcodes `#f5f4f0` (§10.1) | Extend the guard to `index.html`, or accept it as the documented pre-paint fallback | Low — invisible to lint, drifts silently |
| 6 | Dead blue/cyan gradient + `#AA3BFF` sprite (§11.1, §11.2) | Delete `linearGradient10/11` from the logo SVG and remove `public/icons.svg` | Low now — **high** if a future audit or rebuild surfaces the blue and mistakes it for brand |
| 7 | `ember-wash` means both "disabled" and "selected" (§9.6) | Add a distinct `--color-ember-select` tint (e.g. Ember @ 10%) | Low — currently resolved by label + shape |
| 8 | Stale comment: exam header described as ink (§9.7) | Correct `tokens.css` L73 | Cosmetic |

### What NOT to do

- **Do not add role colours** (blue for student, green for faculty, purple for admin). The system's
  uniformity is a feature: a user wearing two hats sees one product. The repo already rejects this
  pattern in words (`DesignPreviewPage.jsx` L650, L655).
- **Do not rename** `answer/review/danger/info/idle` to `success/warning/error`. If generic naming is
  required for external consumers, add aliases that point at the existing palette — do not create a
  second status set. That is precisely how palettes fragment.
- **Do not introduce gradients.** The one-gradient-per-brand rule is working; hero scrims and
  hairlines are alpha, not colour, and should stay that way.
- **Do not relax the lint rule** to accommodate a one-off colour. It is the reason this audit found
  almost nothing, and it is the cheapest design-system governance in the repository.

### One-line verdict

> **Retain `#0B0D10` / `#FBF8F2` / `#E4572E` and the five-status layer exactly as they are; fix the
> two pinned legal pages, collapse the duplicated neutrals and the forked shell, and delete the dead
> blue/cyan gradient so nothing off-brand can be discovered later.**

---
---

# PART II — Deep-dive addendum

*Added after a second pass covering the areas not yet proven to the same standard: systematic
dark-mode conformance across every route, the remaining shared primitives, and the exam status
vocabulary. **This pass found one genuine systemic defect** (§16) that Part I did not surface.*

---

## 16. Dark-mode conformance — one systemic defect

Part I proved `StaticProsePages` was pinned to a non-theming surface. This pass checked **every
route** systematically — 62 routes render a page component, covering 59 distinct
route/page pairs and 55 distinct pages — and found a second, broader pattern.

### 16.1 The root cause

`bg-ink` is **`#0B0D10` in both themes** — deliberately, because the rail and hero are "structure,
not surface" (`WorkspaceLayout.jsx` L21–24). That is correct for *chrome*.

But seven components use `bg-ink` as a **component fill** sitting inside a themed page. In light
mode that reads as a strong black element. In dark mode the page surface *is also* `#0B0D10`, so the
element collapses into the background:

| Component fill `#0B0D10` on… | Light mode | Dark mode |
|---|---|---|
| page surface (`#FBF8F2` / `#0B0D10`) | **18.36:1** ✓ | **1.00:1** ✗ |
| raised card (`#FFFFFF` / `#15181D`) | **19.46:1** ✓ | **1.09:1** ✗ |
| sunken panel (`#F1ECE2` / `#07080A`) | 16.9:1 ✓ | **1.03:1** ✗ |

**The system already contains the correct token.** `Button`'s `secondary` variant uses
`bg-heading text-on-inverse` (`Button.jsx` L45), which resolves to `#0B0D10` on light and `#FBF8F2` on
dark — giving **18.36:1 in both themes**. The affected components bypassed it.

### 16.2 Affected sites, by severity

| Severity | File:line | Element | Dark-mode result |
|---|---|---|---|
| **High** | `NotFoundPage.jsx` L28 | "Back to the overview" CTA — `bg-ink text-paper` | Button fill invisible on `bg-surface-raised` (**1.09:1**). Only the label shows, with no perceivable button boundary — the primary action on a dead end. |
| **High** | `AdminApprovalsPage.jsx` L107 | Active status tab — `bg-ink text-paper` | Pill vanishes on the transparent tablist over `bg-surface` (**1.00:1**). Active state survives only via `text-paper` vs `text-muted`. |
| **High** | `AdminModerationPage.jsx` L92 | Active status tab — identical | Same as above (**1.00:1**). |
| **Medium** | `AdminAuditPage.jsx` L148 | `<thead>` band — `bg-ink text-paper` | Header merges with the page; separated only by `border-b border-line`. |
| **Medium** | `FacultyDashboardPage.jsx` L79 | "Live now" emphasis banner — `bg-ink` | The live-state banner loses its emphasis; delimited only by `border-line`. |
| **Low** | `RecordingEditors.jsx` L38–39 | Trim handles on the scrubber — `w-1 bg-ink` on `bg-surface-sunken` | Handles vanish (**1.03:1**). Notably the *chapter* marks two lines above use `bg-heading` and invert correctly — so the same component mixes both patterns. |
| **Low / defensible** | `AdminSettingsPage.jsx` L143 | Logo-on-ink preview tile — `bg-ink` | Merges into the card (**1.09:1**); defensible, since the tile's purpose is to *simulate* an ink surface. |
| **None (correct)** | `AdminSettingsPage.jsx` L196–197 | Palette swatches — `bg-paper` / `bg-ink` | Must stay fixed; they *are* the reference chips. |
| **None (correct)** | `DesignPreviewPage.jsx` | Specimen swatches | Exempt by definition. |
| **None (correct)** | `FacultyRecordingEditorPage.jsx` L166 | 16:9 player preview frame — `bg-ink text-paper` | Video chrome; always dark in both themes, by the same rule as `RecordingPlayer`. **Originally mis-flagged by my heuristic; reclassified on inspection.** |

### 16.3 Legitimate `bg-ink` uses — must NOT be changed

These are structural chrome, are ink in both themes by design, and read correctly:

- `WorkspaceLayout.jsx` L65 (rail), L171 (avatar chip), L215 (mobile nav sheet)
- `StudentShell.jsx` L100 (rail)
- `AuthLayout.jsx` L23 (auth hero panel)
- `guards.jsx` L64 (loading rail skeleton, mirrors the real rail)
- `RecordingPlayer.jsx` L13, `ClassroomStage.jsx` L109/L215 (video chrome — always dark, industry norm)
- `Card.jsx` L30 (`tone="ink"` — documented structural panel)
- `Badge.jsx` L66/L71, `ThemeToggle.jsx` L52 (paper *on* ink — already inverted correctly)
- `Toast.jsx` L117 (ink toast — deliberate floating contrast layer)

### 16.4 Verdict on dark mode

The token layer's dark mode is **complete and correct** — every alias inverts, contrast holds at
5.2–18.9:1, and the two themes are a true mirror. What fails is **six component call-sites that
reached past the theme layer to a fixed palette value**, plus one pinned page.

**Fix (uniform, one-line each):** replace `bg-ink text-paper` with `bg-heading text-on-inverse` at
the seven sites in §16.2. That is a token swap, not a redesign — it is literally what `Button`
`secondary` already does, and it yields 18.36:1 in both themes.

---

## 17. Route-by-route conformance matrix

Every route, scored on whether its surface repaints with the theme. `pinned` counts non-theming
surface tokens (`bg-ink`/`bg-paper`/`bg-cinema-*`).

| Route | Page | Theming classes | Pinned | Dark mode |
|---|---|---|---|---|
| `/` | `LandingPage` | — (uses `--lg-*`) | 0 | ✓ themed via `.vyuh-landing` |
| `/login` | `LoginPage` | 0 | 0 | ✓ inherits `AuthLayout` |
| `/setup-account` | `SetupAccountPage` | 0 | 0 | ✓ |
| `/forgot-password` | `ForgotPasswordPage` | 1 | 0 | ✓ |
| `/reset-password` | `ResetPasswordPage` | 0 | 0 | ✓ |
| `/student` | `StudentHomePage` | 0 | 0 | ✓ (delegates to cards) |
| `/student/exams` | `ExamsPage` | 2 | 0 | ✓ |
| `/student/exams/:examId` | `ExamDetailPage` | 1 | 0 | ✓ |
| `/student/exams/:examId/instructions` | `ExamInstructionsPage` | 0 | 0 | ✓ |
| `/student/exams/:examId/hall` | `ExamHallPage` | 4 | 0 | ✓ |
| `/student/exams/:examId/result` | `ExamResultPage` | 1 | 0 | ✓ |
| `/student/revision/:topicId` | `TopicRevisionPage` | 1 | 0 | ✓ |
| `/student/live` | `LiveClassesPage` | 0 | 0 | ✓ |
| `/student/live/:sessionId` | `LiveRoomPage` | 0 | 0 | ✓ (classroom pinned light by design) |
| `/student/recordings` | `RecordingsPage` | 0 | 0 | ✓ |
| `/student/recordings/:recordingId` | `RecordingPlayerPage` | 1 | 0 | ✓ |
| `/student/doubts` | `DoubtsPage` | 0 | 0 | ✓ |
| `/student/doubts/:doubtId` | `DoubtThreadPage` | 4 | 0 | ✓ |
| `/student/attendance` | `AttendancePage` | 0 | 0 | ✓ |
| `/student/study-rooms` | `StudyRoomsPage` | 0 | 0 | ✓ |
| `/student/study-rooms/:roomId` | `StudyRoomPage` | 3 | 0 | ✓ |
| `/student/profile`, `/student/account` | `ProfilePage` | 0 | 0 | ✓ |
| `/student/batch` | `StudentBatchPage` | 3 | 0 | ✓ |
| `/faculty/bank` | `FacultyBankPage` | 2 | 0 | ✓ |
| `/faculty/bank/new`, `/:questionId` | `FacultyQuestionEditorPage` | 0 | 0 | ✓ |
| `/faculty/exams` | `FacultyExamsPage` | 2 | 0 | ✓ |
| `/faculty/exams/:examId` | `FacultyExamBuilderPage` | 3 | 0 | ✓ |
| `/faculty/exams/:examId/monitor` | `FacultyExamMonitorPage` | 0 | 0 | ✓ |
| `/faculty/analysis` | `FacultyAnalysisPage` | 4 | 0 | ✓ |
| `/faculty/classes` | `FacultyClassesPage` | 2 | 0 | ✓ |
| `/faculty/classes/:sessionId/host` | `FacultyHostPage` | 0 | 0 | ✓ (studio pinned dark by design) |
| `/faculty/recordings` | `FacultyRecordingsPage` | 3 | 0 | ✓ |
| `/faculty/recordings/:recordingId` | `FacultyRecordingEditorPage` | 1 | 1 | ⚠ trim handles only (player frame is correctly ink) |
| `/faculty/attendance` | `FacultyAttendancePage` | 2 | 0 | ✓ |
| `/faculty/doubts`, `/:doubtId` | `FacultyDoubtsPage` / `DoubtThreadPage` | 4 / 2 | 0 | ✓ |
| `/admin/users` | `AdminUsersPage` | 3 | 0 | ✓ |
| `/admin/users/import` | `AdminImportPage` | 9 | 0 | ✓ |
| `/admin/batches`, `/:batchId` | `AdminBatchesPage` / `AdminBatchDetailPage` | 4 / 1 | 0 | ✓ |
| `/admin/approvals` | `AdminApprovalsPage` | 3 | 1 | ⚠ §16.2 |
| `/admin/policies` | `AdminPoliciesPage` | 3 | 0 | ✓ |
| `/admin/integrity` | `AdminIntegrityPage` | 2 | 0 | ✓ |
| `/admin/reports` | `AdminReportsPage` | 1 | 0 | ✓ |
| `/admin/moderation` | `AdminModerationPage` | 2 | 1 | ⚠ §16.2 |
| `/admin/audit` | `AdminAuditPage` | 2 | 1 | ⚠ §16.2 |
| `/admin/settings` | `AdminSettingsPage` | 3 | 3 | ⚠ low (§16.2) |
| `/admin/account` | `AccountPage` | 0 | 0 | ✓ |
| `/access-denied` | `AccessDeniedPage` | 1 | 0 | ✓ |
| `/accessibility` | `AccessibilityPage` | 0 | 0 | ✓ |
| `/design-preview` | `DesignPreviewPage` | 10 | 9 | ✓ exempt (specimen) |
| `/about`, `/privacy` | `StaticProsePages` | **0** | **1** | ✗ **pinned light** |
| `*` | `NotFoundPage` | 0 | 1 | ⚠ §16.2 |

**Score: of 59 distinct route/page pairs, 50 theme cleanly.**
- **3 distinct pages are pinned** → 2 genuinely broken routes (`/about`, `/privacy`) plus the 404; they
  account for 6 route entries because the same pages are registered more than once.
- **6 route/page pairs have component-level ink fills** that lose their fill in dark mode while keeping
  readable text (§16.2): `/admin/approvals`, `/admin/moderation`, `/admin/audit`, `/admin/settings`,
  `/faculty/recordings/:recordingId` (via `RecordingEditors` trim handles), and `/design-preview`
  (exempt — it is the specimen page, which is *supposed* to render fixed swatches).

Two routes are **intentionally pinned** and should be left alone:
`/student/live/:sessionId` (`ClassroomShell.jsx` L6 pins `data-theme="light"`) and
`/faculty/classes/:sessionId/host` (`StudioShell.jsx` L134 pins `data-theme="dark"`).
That is a deliberate stage direction — the student classroom is always light, the faculty studio
always dark, so the mirrored views read as "the same room, two sides of the glass."

---

## 18. Two status vocabularies coexist (shape divergence, colour agreement)

Colour is consistent. **Shape language is not.** Two independent status glyph systems exist:

### 18.1 `Badge` — the general UI vocabulary (`Badge.jsx` L7–13)

| State | Shape | Colour |
|---|---|---|
| answer | filled **square** ✓ | `#5FA777` |
| review | **diamond (45°)** | `#F2B33D` |
| danger | **ring with cut** | `#B23A48` |
| info | filled **circle** | `#7CC4D9` |
| idle | **hollow square** | `#A8A195` |

### 18.2 `StatusShape` — the exam-hall vocabulary (`exam/components/StatusShape.jsx` L10–14)

| State | Shape | Colour |
|---|---|---|
| not_visited | hollow square (`rounded-[2px]`, `border-line-strong`) | none (transparent) |
| not_answered | filled **square** (`rounded-[2px]`) | `bg-danger` `#B23A48` |
| answered | filled **square** (`rounded-[5px]`) | `bg-answer` `#5FA777` ✓ |
| review | **circle** (`rounded-full`) | `bg-review` `#F2B33D` |
| review_answered | **ringed circle** (`border-2 border-answer`) | `bg-review` + answer ring |

### 18.3 Where they disagree

| State | Badge glyph | Exam glyph | Conflict? |
|---|---|---|---|
| answered | filled square | filled square | ✓ agree |
| review | **diamond** | **circle** | ✗ disagree |
| danger / not answered | **ring with cut** | **filled square** | ✗ disagree |

**Consequence:** on one exam screen, "marked for review" can appear as a **diamond** (via
`ExamStatusBadge` → `Badge`) and as a **circle** (via `QuestionPalette` → `StatusShape`). Colour
stays marigold in both, so no meaning is lost — but the "shapes carry meaning" promise
(`Badge.jsx` L4–6) is weakened, because *a shape does not mean the same thing in both systems*.

Note the divergence is partly justified: the exam vocabulary is explicitly **NTA-style**
(`StatusShape.jsx` L5), matching the real Indian exam interface students will meet. So this is a
deliberate domain override, not an oversight — but it is undocumented as such in `tokens.css`, and a
future contributor could reasonably "fix" one to match the other. Worth a comment.

---

## 19. Remaining shared primitives — all clean

The twelve primitives not covered in Part I were checked. All are token-composed, none contains a
literal, none bypasses the theme layer:

| Primitive | Tokens used | Verdict |
|---|---|---|
| `Dialog.jsx` | `bg-surface-raised`, `border-line`, `border-danger`, `text-on-signal-inverse` | ✓ |
| `Tabs.jsx` | `text-heading`/`muted`/`faint`, `border-line`, `outline-ember` | ✓ (uses ember focus, not ember fill) |
| `Select.jsx` | `text-heading`/`muted`/`faint`, `text-danger-fg`, `border-line-strong`, `outline-ember` | ✓ |
| `Checkbox.jsx` | `bg-heading`, `border-heading`, `text-on-inverse`, `text-danger-fg` | ✓ — **correctly** uses `heading`/`on-inverse` (the same fix needed in §16.2) |
| `Radio.jsx` | `border-line`, `border-heading`, `outline-ember` | ✓ |
| `Tooltip.jsx` | `bg-surface-inverse`, `text-on-inverse`, `border-line` | ✓ |
| `Kbd.jsx` | `bg-surface-sunken`, `border-line-strong`, `border-hairline-on-ink-strong` | ✓ |
| `EmptyState.jsx` | `bg-surface-raised`, `border-line`, `text-heading`/`muted`/`faint` | ✓ |
| `ErrorState.jsx` | `bg-surface-raised`, `border-l-danger`, `text-danger-fg` | ✓ — semantic border-left, no full fill |
| `Skeleton.jsx` | `color-mix` off `--color-body` (via `.skeleton` in `index.css`) | ✓ theme-aware by construction |
| `SectionLabel.jsx` | `bg-line`, `bg-hairline-on-ink` | ✓ |
| `IconButton.jsx` | `text-heading`/`muted`/`ember-press`, `border-line-strong`, `border-heading` | ✓ |

`Checkbox.jsx` is worth noting as the **reference implementation** of the pattern that §16.2
recommends: it uses `bg-heading` + `text-on-inverse` for its checked fill, so it inverts correctly
in both themes.

---

## 20. Additions to the recommendation

Part I's recommendation stands unchanged (**retain the palette, standardise the duplications**).
This pass adds one item that is more urgent than anything in the original list, and re-orders the
table:

| # | Issue | Action | Severity |
|---|---|---|---|
| **1** | **7 components use `bg-ink` as a component fill → 1.00–1.09:1 in dark mode (§16.2)** | Swap `bg-ink text-paper` → `bg-heading text-on-inverse` at the seven sites. `Checkbox.jsx` and `Button.jsx` L45 already show the pattern. | **High — a CTA loses its button fill entirely** |
| 2 | `/about` + `/privacy` pinned to `cinema-paper` (§10.2) | Point at `bg-surface text-body` + text ramp | **High** |
| 3 | Two neutral pairs `#0B0D10`/`#0D0D0F`, `#FBF8F2`/`#F5F4F0` (§9.1) | Alias cinema → Ink/Paper, or document the "film grade" explicitly | Medium |
| 4 | `StudentShell` forks `WorkspaceLayout` (§9.2) | Fold into the shared shell via slots | Medium |
| 5 | Two status shape vocabularies disagree on review/danger (§18.3) | Add a comment in `tokens.css` declaring the exam vocabulary an intentional NTA override | Medium — prevents a future "fix" |
| 6 | Two `ThemeToggle` active treatments (§9.3) | Adopt the shared primitive with an accent variant | Low |
| 7 | `index.html` L32 hardcodes `#f5f4f0` (§10.1) | Extend the guard, or document as pre-paint fallback | Low |
| 8 | Dead blue/cyan gradient + `#AA3BFF` sprite (§11.1–11.2) | Delete `linearGradient10/11`; remove `public/icons.svg` | Low now, high later |
| 9 | `ember-wash` = disabled *and* selected (§9.6) | Add a distinct select tint | Low |
| 10 | Stale comment: exam header described as ink (§9.7) | Correct `tokens.css` L73 | Cosmetic |

### Revised one-line verdict

> **The palette is sound and should be retained. The one real defect is not in the palette but in seven
> call-sites that reached past it: `bg-ink` used as a component fill collapses to 1.00:1 against the
> dark surface, and the fix is a token the system already ships (`bg-heading text-on-inverse`). Swap
> those seven, unpin the two legal pages, and the colour system is consistent across all three roles in
> both themes.**
