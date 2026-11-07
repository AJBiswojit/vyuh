# mock-data

The only folder in Vyuh that holds fixture data, and the only one that may be
deleted wholesale. Everything a screen reads — students, batches, papers,
attempts, sessions, notices — lives here as plain objects that satisfy the JSDoc
contracts in `src/contracts/`.

## Rules

1. **Nothing outside `src/services/mock/` imports from this folder.** A screen
   reaches data through a feature hook, which calls a service, which reads a
   fixture. `npm run lint` fails the build on a violation.
2. **Fixtures are immutable.** `simulate()` deep-clones on the way out, so a
   reducer can mutate its payload without corrupting the next reader.
3. **Contracts first.** If a field is needed on screen, add it to
   `src/contracts/`, then to the fixture — not the other way round.
4. **Copy is real.** No lorem ipsum, no "Test 1", no `john@example.com`. The
   fixtures describe a fictional institute — *Vidyut Academy, Bhubaneswar* — so
   that spacing, truncation and truncation-of-real-words are judged honestly.
5. **Latency and failure are simulated here, always.** `latency.js` owns both.
   No service calls `setTimeout` directly.
6. **Everything is exported through `index.js`.** That barrel is the single point
   a service touches, which is what makes step 3 of the removal recipe a one-line
   change.

## The institute we model

| | |
|---|---|
| Institute | Vidyut Academy, Bhubaneswar |
| Tracks | JEE (Main + Advanced), NEET, NTA foundation |
| Batches | Prayas (Class 11), Aarambh (Class 12), Shikhar (droppers), Aarogyam (NEET) |
| Term | 2026–27, Session 2 |
| Paper patterns | JEE Main: 75 questions / 300 marks / 180 min. NEET: 180 / 720 / 200 min. |

## Files

| File | Contract(s) | Read by |
|---|---|---|
| `latency.js` | — | every mock service |
| `institute.js` | `InstituteProfile` | landing, footer, sign-in |
| `users.js` | `User`, `Student`, `AuthSession` | auth, shell, dashboard |
| `academics.js` | `Subject`, `Chapter`, `Batch` | batch screens, office register |
| `assessments.js` | `Test`, `Attempt`, `ScoreReport`, `TrendPoint` | overview, reports |
| `sessions.js` | `LiveSession`, `DailyStudyPoint` | overview, live classes |
| `courses.js` | `Course` | course catalogue |
| `dashboard.js` | `DashboardSnapshot`, `Announcement` | student overview |
| `index.js` | — | barrel; the only import target for services |

## Removing mock data before production

The order matters: the app must still type-check and build at every step.

1. **Flip the flag.** In `.env`, set `VITE_USE_MOCK=false` and confirm the app
   boots against the real API. Nothing should still be reading fixtures at
   runtime; if a screen breaks here, a hook is calling a mock directly and must
   be fixed before you continue.
2. **Delete the services that fake it.** Remove `src/services/mock/` and the
   `mockServices` / `demoAccounts` exports in `src/services/index.js`. Set
   `isMockMode` to a constant `false` so the demo banners and demo-seat list stop
   rendering.
3. **Delete the barrel, then the folder.** Remove `src/mock-data/index.js`,
   then `src/mock-data/`. Keep `latency.js` only if you want a latency-injecting
   proxy for performance testing; otherwise it goes with the rest.
4. **Drop the flag.** Remove `VITE_USE_MOCK`, `VITE_MOCK_ERRORS` and
   `VITE_MOCK_ERROR_RATE` from `.env`, `.env.example` and the README table.
5. **Prove it.** `grep -r "mock-data" src/` must return nothing, and
   `npm run lint` must pass — the architecture guard already forbids
   presentation code from importing either folder.
