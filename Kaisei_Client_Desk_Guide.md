# Kaisei Client Desk - Complete Guide

*Setup manual - user manual - developer notes - viva prep*

## 1. What this project is
Kaisei Client Desk is a full-stack web application for a freelance web studio. A studio lives and dies by three lists: who the clients are, what projects are in flight for them, and which invoices are still unpaid. This app keeps all three in one relational database and shows the money picture (billed, collected, outstanding) on a dashboard.

## 2. Why these tables
- A client exists on its own: name, company, email, phone.
- A project cannot exist without a client, so `projects.clientId` is a foreign key to `clients.id`.
- A studio task is one work item inside a project ("design the calendar UI"): `tasks.projectId` is a foreign key to `projects.id`, with a `done` flag and a due date.
- An invoice cannot exist without a project, so `invoices.projectId` is a foreign key to `projects.id`.

That gives a clean chain: clients 1-N projects 1-N (tasks, invoices). The rules the database itself enforces:
- `clients.email` is UNIQUE - the same email cannot be registered twice (API returns 409).
- Deleting a client while it has projects is refused by the API (409) - project history is business data.
- Deleting a project cascades to its tasks and invoices (ON DELETE CASCADE) - they are meaningless alone.

## 3. Technology choices (and the reason for each)
| Choice | Why |
|---|---|
| React 19 + Vite | Component UI; Vite gives instant dev reload |
| Node.js + Express 5 | Same language as the frontend; minimal, well-known framework |
| PostgreSQL | Real relational database: constraints, joins, aggregates |
| Prisma 7 | Type-safe ORM + migrations, so the schema lives in Git |
| Plain CSS | No framework hides what the styling actually does |
| Money in paise (integers) | Floats round: 0.1 + 0.2 != 0.3. Integers never drift |

## 4. Architecture (three tiers)
```
[Presentation]            [Logic]                    [Data]
React app in browser  ->  Express REST API       ->  PostgreSQL
localhost:5173            localhost:5000            localhost:5432
components, forms         routes -> controllers     tables: clients,
                          -> validation -> Prisma   projects, invoices
```
Rules that keep the tiers honest:
- The browser never talks to the database directly; it only knows HTTP + JSON.
- The backend never trusts the browser: every input is validated again server-side.
- The database is the last line of defence: NOT NULL, UNIQUE, FK, CHECK-style length limits.

## 5. Backend walkthrough
Request flow for `POST /api/projects`:
1. `app.js` middleware: CORS header, JSON body parsing, request logging.
2. `routes/projectRoutes.js` matches POST / to `createProject`.
3. `controllers/projectController.js` calls `validateProject(req.body)`:
   - clientId must be a positive integer
   - title required, <= 140 chars
   - deadline must be a real calendar date in YYYY-MM-DD (2026-02-31 is rejected)
   - budget, if present, must be a positive amount with <= 2 decimals, converted to paise
4. Controller checks the client exists (404 if not).
5. `prisma.project.create({ data })` runs a parameterised INSERT.
6. 201 Created with the saved row as JSON.

Errors anywhere in that flow are thrown, not returned, and land in one place:
`middleware/errorHandler.js` maps them to a consistent shape:
- our HttpError -> its status + message (+ field details)
- malformed JSON -> 400
- Prisma P2002 (unique email) -> 409 "A client with this email already exists"
- Prisma P2025 (record missing) -> 404
- database down -> 503
- anything else -> logged, generic 500 (no internals leaked)

## 6. Frontend walkthrough
- `App.jsx` owns the state: clients, projects, invoices, stats, selected client, status filter, search text, loading and error.
- `api.js` is the only file that knows URLs. It unwraps the API's error JSON so components can show `err.message` and per-field `err.details`.
- Components: `StatsBar`, `ClientSidebar` (search + list + add-client form), `ProjectBoard` (filter tabs + project cards + invoice tables), `ProjectForm` and `InvoiceForm` (modal dialogs used for both create and edit).
- Data flows down as props; events flow up as callbacks (`onChanged` reloads from the server after every mutation, so the screen always shows stored truth).
- Every fetch after a change re-pulls stats in the same `Promise.all`, so the dashboard counters can never disagree with the list.

## 7. The states a user can see
| State | What the UI shows |
|---|---|
| Loading | "Loading..." under the board header |
| Empty | dashed empty-state box with guidance |
| Validation error | red field + message under the exact input |
| Conflict (e.g. duplicate email) | red banner with the API's message |
| API/database down | full-page error with Retry |
| Saving | button disabled, caption "Saving..." |

## 8. Money and dates
- API input is rupees (`budgetRupees`, `amountRupees`); storage is integer paise; display uses `Intl.NumberFormat("en-IN", { currency: "INR" })` so ₹52,500 prints the Indian way.
- Dates travel as YYYY-MM-DD strings; the parser rejects impossible dates instead of letting JavaScript silently roll 31 February into March.

## 9. Testing the API without the UI
Import `postman/Kaisei_Client_Desk.postman_collection.json`. The 31 requests run in a sensible order: happy paths first, then deliberate failures (duplicate email 409, bad date 400, unknown client 404, double payment 409, deleting a client that has projects 409, unknown route 404). Watching those fail correctly IS the test suite.

## 10. Viva questions you should be able to answer
1. Why three tables instead of one? (Normalization: no repeated client data on every project; updates happen in one place.)
2. What stops a client being deleted with projects? (API check returning 409; FK would also block without cascade.)
3. Why paise, not rupees? (Binary floating point cannot represent 0.1 exactly.)
4. Where is validation done and why twice? (Browser for fast feedback, server for safety - the browser can be bypassed with curl.)
5. What SQL does Prisma send for the dashboard? (Set LOG_QUERIES=true and watch COUNT / SUM queries.)
6. What is CORS and who enforces it? (Browser enforces; Postman ignores it; it is not authentication.)
7. Walk one change end to end. (Form -> fetch -> route -> controller -> validation -> Prisma -> SQL -> 201 JSON -> reload -> re-render.)

## 11. Honest limitations (good to volunteer in a viva)
- Single-user: no login, anyone opening the app sees the studio's data.
- No pagination: every list is returned whole.
- No deployment yet; CORS allows only localhost:5173.
- Invoice numbers are database ids, not pretty INV-2026-001 strings.
