# DevWorks Portal

Internal agency platform for DevWorks Studio. A Progressive Web App (PWA) with two distinct personas: the team's internal workspace and a client-facing portal.

---

## What It Is

DevWorks Portal centralizes the agency's operations — client relationships, project management, knowledge base, and website maintenance services — in a single app. Clients get their own view into the work being done for them, without seeing internal tooling.

---

## Two Personas

### Team Dashboard (`/dashboard`)
The internal workspace for DevWorks Studio staff. Only accessible to users with `role = 'team'`.

### Client Portal (`/portal`)
A read-only window into the agency's work for a specific client. Accessible to any authenticated user. Currently shows a teaser state; full functionality is planned for v2.

---

## Authentication

 Users sign in with their email, and are redirected based on their role (`team` → dashboard, `client` → portal). Sessions are managed via cookies using Supabase SSR. Role is stored in `user_metadata.role` on the Supabase auth user.

---

## Modules

### CRM — Clients
Manages the agency's client list. Each client has contact info (name, email, phone, company), an assigned team member, a status (e.g. Prospecto, Activo, Inactivo), and free-form notes. The client detail page shows all linked projects and tasks.

### Projects
Tracks work engagements per client. Each project has a lifecycle status, start/end dates, and is broken into **phases**. Within each phase live **tasks** with titles, descriptions, due dates, priority, assignee, and status.

Tasks have three views:
- **Table** — sortable list with inline status cycling
- **Kanban** — drag-and-drop columns via `@dnd-kit`
- **Calendar** — due-date visualization

### Knowledge Base
An internal wiki for the team. Organized into a folder tree with nested folders. Articles are written in a Notion-like rich-text editor (Novel) and stored as JSON. The KB works **offline-first**: content is cached in IndexedDB on first load. Edits made while offline are queued and synced on reconnect. The service worker serves the KB from cache when the network is unavailable.

### Maintenance Plans
Manages recurring website maintenance services sold to clients. Two plan types:

**Sistema Presencia Total (SPT)**
A fixed 5-month package, tied to a specific project (typically a website delivery). All 5 months are created upfront when the plan is activated.

**Recurrente**
An ongoing monthly service with no fixed end date. One month is created when the plan starts; subsequent months are created automatically on the 1st of each month by a cron job.

Each month contains:
- **Weekly tasks** grouped into 4 weeks, seeded from a default template on creation
- **SEO metrics** entered manually by the team (Google Search Console data, PageSpeed scores, sessions, CTR, etc.)
- **Automatic DOCX report** generated 3 days before month end and stored in Supabase Storage

Plan lifecycle is automated:
- **1st of month** → new month created + tasks seeded for all active plans
- **Last day of month** → current month closed; SPT plans auto-complete at month 5; `pending_deactivation` plans are archived

---

## Push Notifications (PWA)

The app sends web push notifications via the Web Push API (`web-push` library). Subscriptions are stored per-user and per-device in a `push_subscriptions` table.

Three types of notifications run on a daily cron schedule:

| Notification | When | What |
|---|---|---|
| **Morning digest** | 8am MX (14:00 UTC) | Summary of the user's tasks due today + expired tasks |
| **24h reminder** | 8am MX (14:00 UTC) | Per-task alert for tasks due tomorrow |
| **1h reminder** | 10pm MX (22:00 UTC) | Per-task alert for tasks due today |

Notifications are deduplicated via a `task_notification_log` table so the same alert is never sent twice.

---

## Database

PostgreSQL via Supabase. Key tables:

| Table | Purpose |
|---|---|
| `profiles` | 1:1 extension of `auth.users` — stores `full_name`, `avatar_url`, `role` |
| `catalog_status` | Central lookup for all statuses and priorities across modules (category-scoped) |
| `clients` | Agency CRM — contact info, status, assignee |
| `projects` | Work engagements linked to clients |
| `phases` | Ordered phases within a project |
| `tasks` | Actionable work items within phases |
| `maintenance_plans` | SPT or recurring maintenance contracts |
| `maintenance_months` | One row per calendar month per active plan |
| `maintenance_tasks` | Weekly tasks within a month |
| `maintenance_metrics` | SEO/analytics data entered per month |
| `maintenance_task_templates` | Default task list seeded into each new month |
| `kb_folders` | Nested folder tree for the knowledge base |
| `kb_articles` | Rich-text articles stored as JSON |
| `push_subscriptions` | Web push subscription keys per user/device |
| `task_notification_log` | Deduplication log for push notifications |
| `notifications` | In-app notification inbox |

All statuses and priorities across every module (client status, project status, task status, priority, maintenance status) live in `catalog_status` and are distinguished by `category`. Labels are always in Spanish.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4, shadcn/ui (new-york) |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Drag and drop | @dnd-kit |
| Rich text | Novel (Notion-like editor) |
| Push notifications | web-push (VAPID) |
| Offline storage | IndexedDB (raw, no library) |
| Reports | docx (planned — DOCX generation) |
| Icons | lucide-react |
| Theme | next-themes |

---

## Design

**Dashboard** — "Editorial Agency Dark". Full-screen dark UI: deep gray backgrounds, subtle white borders, amber brand accent. Cal Sans for headings, DM Sans for body text.

**Portal** — Light mode, white header, clean and client-appropriate. Same typography.

---

## Implementation Status

| Module | Status |
|---|---|
| Auth (magic link + role routing) | Done |
| CRM — clients list + detail + new | Done |
| Projects list + detail | Done |
| Tasks — table, kanban, calendar views | Done |
| Knowledge Base + offline sync | Done |
| Maintenance — plans list + plan detail | In Progress |
| Maintenance — DOCX report generation | In Progress |
| Maintenance — cron lifecycle | Done |
| Push notifications — due date reminders | Done |
| Push notifications — morning digest | Done |
| Client Portal (shell only) | Done |
| Deliverables module | Not started |
| Client portal — project/report visibility | Backlog |
| Payments / Invoicing | Backlog |
| Contract signing | Backlog |
