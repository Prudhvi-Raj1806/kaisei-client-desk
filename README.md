# Kaisei Client Desk

A full-stack web app for a freelance web studio: keep track of clients, the projects you build for them, and the invoices you raise.

**Stack:** React (Vite) • Node.js + Express • PostgreSQL • Prisma ORM • plain CSS

**Features:** studio tasks per project (add / view / edit / toggle done / delete, due dates, overdue highlighting) • manage clients (add / edit / delete, search by name or company) • manage projects per client (brief, deadline, budget, status DRAFT / ACTIVE / DELIVERED / CANCELLED) • raise invoices per project and mark them paid or void • dashboard totals (clients, active projects, outstanding and collected amounts) • filter projects by status and sort by deadline • overdue highlighting • duplicate-email protection • validation with readable errors on both sides.

```
React (localhost:5173)  --HTTP/JSON-->  Express API (localhost:5000)  --Prisma-->  PostgreSQL (localhost:5432)
```

**Data model:** clients 1—N projects 1—N (invoices, studio tasks) - real foreign keys. A client cannot be deleted while it still has projects; deleting a project removes its invoices and tasks.

> The longer manual (setup, architecture, API reference, troubleshooting, viva notes) is in **Kaisei_Client_Desk_Guide.md**.

**GitHub repo:** https://github.com/Prudhvi-Raj1806/kaisei-client-desk
**Deployed app:** https://kaisei-client-desk.vercel.app/  (API: https://kaisei-client-desk-api.vercel.app/api)

## Prerequisites
- Node.js 22 or newer (LTS) — https://nodejs.org
- PostgreSQL 16 or newer — https://www.postgresql.org/download/
- (optional) Postman — https://www.postman.com/downloads/

## Quick start (PowerShell)

1. Create an empty database called `kaisei_client_desk` (pgAdmin, or
   `psql -U postgres -c "CREATE DATABASE kaisei_client_desk;"`).

2. Backend (terminal 1):
```powershell
cd backend
Copy-Item .env.example .env      # then edit .env: put your PostgreSQL password in DATABASE_URL
npm install
npx prisma generate              # generates the Prisma client
npx prisma migrate deploy        # creates the tables
npm run seed                     # demo data: 4 clients, 5 projects, 4 invoices, 5 tasks
npm run dev                      # API on http://localhost:5000
```

3. Frontend (terminal 2):
```powershell
cd frontend
npm install
npm run dev                      # app on http://localhost:5173
```

4. Open http://localhost:5173. Check the database connection at http://localhost:5000/api/health.

## API summary
| Method | URL | Purpose |
|---|---|---|
| GET | `/api/health` | Server + database check |
| GET | `/api/stats` | Dashboard totals (counts + money) |
| GET | `/api/clients?search=` | List / search clients |
| POST | `/api/clients` | Add client |
| GET | `/api/clients/:id` | One client with its projects and invoices |
| PUT | `/api/clients/:id` | Edit client |
| DELETE | `/api/clients/:id` | Delete client (409 while it has projects) |
| GET | `/api/projects?status=&clientId=&sort=&order=` | List projects (filter/sort) |
| POST | `/api/projects` | Add project |
| GET | `/api/projects/:id` | One project with client + invoices |
| PUT | `/api/projects/:id` | Edit project |
| PATCH | `/api/projects/:id/status` | Change DRAFT / ACTIVE / DELIVERED / CANCELLED |
| DELETE | `/api/projects/:id` | Delete project (and its invoices) |
| GET | `/api/tasks?projectId=&done=` | List studio tasks |
| POST | `/api/tasks` | Add task |
| GET | `/api/tasks/:id` | One task |
| PUT | `/api/tasks/:id` | Edit task |
| PATCH | `/api/tasks/:id/toggle` | Toggle done / not done |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/invoices?status=&projectId=` | List invoices |
| POST | `/api/invoices` | Raise invoice |
| PATCH | `/api/invoices/:id/mark-paid` | Mark paid (stamps paidOn) |
| PATCH | `/api/invoices/:id/void` | Void an unpaid invoice |
| DELETE | `/api/invoices/:id` | Delete invoice |

Import `postman/Kaisei_Client_Desk.postman_collection.json` into Postman to try them.

## Scripts
| Folder | Command | Meaning |
|---|---|---|
| backend | `npm run dev` | start API with auto-restart |
| backend | `npm start` | start API |
| backend | `npm run seed` | load demo data (once, on an empty DB) |
| frontend | `npm run dev` | start React dev server |
| frontend | `npm run build` | production build |

## Project structure
```
backend/   src/ (server, app, routes/, controllers/, middleware/, utils/, prisma client)
           prisma/ (schema.prisma, migrations/)
frontend/  src/ (App.jsx, api.js, components/, styles.css)
postman/   Postman collection
screenshots/  the app running
```

## Money note
Amounts are stored in **paise** (integers), never floating-point rupees, so totals never drift by rounding. The API accepts rupees and converts.

## Security note
Never commit `backend/.env` (it holds your database password). Only `.env.example` is in Git.
