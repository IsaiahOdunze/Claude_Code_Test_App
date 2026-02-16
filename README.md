# Office Chores

A web app for managing and tracking recurring office chores across a team. Features a calendar view of assigned tasks, chore scheduling with recurrence, team member management, and completion tracking — all behind role-based authentication.

Built with React, Express, Prisma, and SQLite.

## Tech Stack

- **Client:** React, TypeScript, Vite, Tailwind CSS, FullCalendar, TanStack Query, Zustand
- **Server:** Express, TypeScript, Prisma, SQLite, JWT auth

## Prerequisites

- Node.js (v18+)
- npm

## Getting Started

### 1. Install dependencies

```sh
cd server && npm install
cd ../client && npm install
```

### 2. Set up the database

```sh
cd server
npx prisma migrate dev
```

### 3. Seed the database

Creates a default admin user (`admin@example.com` / `admin123`):

```sh
cd server
npm run db:seed
```

### 4. Run the app

Start the server and client in separate terminals:

```sh
# Terminal 1 — server (runs on http://localhost:3001)
cd server
npm run dev

# Terminal 2 — client (runs on http://localhost:5173)
cd client
npm run dev
```

Open http://localhost:5173 in your browser.

## Default Credentials

| Role  | Email               | Password   |
|-------|---------------------|------------|
| Admin | admin@example.com   | admin123   |

Admins can manage chores, assignments, and team members. Regular members can view the calendar and mark their assigned chores as complete.
