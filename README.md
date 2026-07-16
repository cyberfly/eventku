# Eventmu

A TanStack Start starter project for an Eventbrite-style training marketplace. The app uses Drizzle ORM with SQLite and ships with seeded seminar and attendee data so the UI has meaningful content on first run.

## Stack

- TanStack Start + TanStack Router
- React 19
- Drizzle ORM
- SQLite via `better-sqlite3`
- Zod for purchase form validation

## What is included

- Marketplace landing page with booking KPIs
- Event listing and event detail pages
- Purchase flow that creates attendee registrations
- Organizer backend for login, course creation, and course management
- Drizzle schema, generated migration, and automatic seed bootstrap

## Run locally

```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
```

The SQLite file is created at `data/lms.sqlite` by default.

Default organizer credentials come from the environment:

```bash
ORGANIZER_EMAIL=organizer@eventmu.local
ORGANIZER_PASSWORD=organizer123
```

You can replace these values in `.env` before running the app.

## Useful commands

```bash
pnpm dev
pnpm build
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```
