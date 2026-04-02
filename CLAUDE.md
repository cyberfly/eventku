# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server on http://127.0.0.1:3000
pnpm build            # Production build
pnpm preview          # Preview production build

pnpm db:generate      # Generate migrations from schema changes
pnpm db:migrate       # Run pending migrations
pnpm db:studio        # Open Drizzle visual DB editor
```

**First-time setup:**
```bash
cp .env.example .env
pnpm install
pnpm db:migrate       # Also seeds initial data
pnpm dev
```

Default organizer login comes from `.env` (`ORGANIZER_EMAIL` / `ORGANIZER_PASSWORD`).

## Architecture

**Stack**: TanStack Start (full-stack React) + TanStack Router (file-based) + Drizzle ORM + SQLite (`better-sqlite3`) + Zod

### Two domains

- **Marketplace** (`/`, `/events/*`): Public event browsing and purchasing
- **Organizer** (`/organizer/*`): Authenticated admin panel for course/content management

### Layers

| Layer | Location | Role |
|---|---|---|
| Routes | `src/routes/` | Page components + loaders (TanStack Router file-based routing) |
| Server functions | `src/lib/organizer-server-fns.ts` | Type-safe RPC via `createServerFn()` |
| Business logic | `src/server/` | Database queries, auth logic |
| Schemas | `src/lib/` | Zod validation schemas + formatting utilities |
| Components | `src/components/` | Reusable UI |
| DB | `src/db/` | Drizzle schema, migrations, seed data |

### Server function pattern

Routes call server functions from `src/lib/organizer-server-fns.ts`. Server functions are defined with `createServerFn().handler()` and validated with Zod before execution. Business logic lives in `src/server/lms.ts` (marketplace) and `src/server/organizer.ts` (admin).

### Database

SQLite at `./data/lms.sqlite` (configurable via `DB_FILE_NAME` env var). Schema in `src/db/schema.ts` defines: `organizers`, `organizer_sessions`, `courses`, `modules`, `lessons`, `enrollments`, `tickets`, `ticket_messages`.

Relations: Organizers → Courses → Modules → Lessons; Courses → Enrollments/Tickets.

`bootstrapDatabase()` in `src/db/index.ts` runs migrations and seeds data automatically on startup if tables are empty.

### Routing

`src/routeTree.gen.ts` is auto-generated — do not edit. Add new pages by creating files in `src/routes/`. Naming conventions: `feature.tsx` (layout), `feature.index.tsx` (index page), `feature.$param.tsx` (dynamic segment).

### Styling

Custom CSS only — no Tailwind or CSS framework. Global styles in `src/styles.css` using CSS variables (`--bg`, `--ink`, `--green`, `--orange`, `--blue`).
