# Run this on YOUR laptop (Windows) - 15 minutes

You need: Node.js 22 LTS (nodejs.org) and PostgreSQL 16 (postgresql.org/download). Remember the postgres password you set during install.

## 1. Unzip
Unzip the project somewhere, e.g. `C:\projects\kaisei-client-desk`.

## 2. Create the database (one time)
Open "SQL Shell (psql)" from the Start menu, press Enter for every prompt except password (use your postgres password), then:
```sql
CREATE DATABASE kaisei_client_desk;
\q
```

## 3. Backend (PowerShell window 1)
```powershell
cd C:\projects\kaisei-client-desk\backend
Copy-Item .env.example .env
notepad .env     # replace YOUR_PASSWORD in DATABASE_URL with your postgres password
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed       # demo data so the app isn't empty (only works on an empty DB)
npm run dev
```
You should see: "Kaisei Client Desk API on http://localhost:5000".
Check http://localhost:5000/api/health in the browser: it must say "database": "connected".

## 4. Frontend (PowerShell window 2)
```powershell
cd C:\projects\kaisei-client-desk\frontend
npm install
npm run dev
```
Open http://localhost:5173.

## 5. Make YOUR demo data
`npm run seed` loads a demo set (4 clients, 5 projects, 4 invoices, 5 tasks). Prefer your own? Skip the seed and add them through the UI - but have SOME data before any demo.

## If something fails
- "Port 5000 is busy" -> change PORT in backend\.env to 5001 and set VITE_API_URL=http://localhost:5001/api in frontend\.env.
- Prisma can't reach the database -> wrong password in DATABASE_URL, or PostgreSQL service not running (services.msc -> postgresql -> Start).
- npm command not found -> Node not installed / reopen PowerShell after installing.
