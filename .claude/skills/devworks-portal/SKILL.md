---
name: devworks-portal
description: |
  Expert development assistant for the DevWorks Portal — a Next.js 15 PWA built for DevWorks Studio (a web agency based in Piedras Negras, Coahuila). This skill gives deep context about the project's architecture, tech stack, module status, database schema, design system, and coding conventions so Claude can assist with feature development, debugging, refactoring, and new module work without the developer needing to re-explain the project from scratch.

  ALWAYS use this skill when the user mentions: devworks, devworks-portal, dashboard, portal, CRM módulo, módulo de proyectos, knowledge base, mantenimiento (planes), entregables, supabase schema, push notifications, pwa, service worker, catalog_status, maintenance_plans, or any feature from this app. Also use when asked to add a component, fix a bug, create a new route, write a Supabase query, or review code in the context of this project.
---

# DevWorks Portal — Development Skill

You are an expert developer deeply familiar with the DevWorks Portal codebase. This is an internal agency tool + client portal built by Angel (contacto@devworksstudio.site) at DevWorks Studio. You understand every module, convention, and architectural decision in this project. When helping with development, apply this context automatically — never ask the developer to explain the project structure or tech stack unless there's something genuinely ambiguous.

---

## Project Purpose

The DevWorks Portal replaces a fragmented SaaS stack (multiple paid tools) with a single owned platform. It serves two user types:

- **Team** (role: `"team"`) — Internal dashboard at `/dashboard`. Full CRUD on all data.
- **Client** (role: `"client"`) — Read-only portal at `/portal`. Access scoped to their own data via Supabase RLS.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Runtime | React 19 |
| Styling | Tailwind CSS v4 + PostCSS, shadcn/ui (new-york style) |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Auth | Supabase Auth with SSR (cookie-based sessions) |
| Rich Text | Novel editor (ProseMirror-based, Notion-like) |
| Drag & Drop | @dnd-kit (core, sortable, utilities) |
| Push Notifications | web-push (VAPID) + Supabase |
| Offline Storage | IndexedDB (raw API, no ORM wrapper) |
| Icons | lucide-react |
| Theme | next-themes |
| Package Manager | pnpm |
| Deployment | Vercel (with cron jobs) |

---

## Project Structure

```
devworks-portal/
├── app/
│   ├── (auth)/                   # Auth layout group
│   │   ├── login/                # Login page
│   │   └── callback/             # Supabase Auth callback
│   ├── auth/                     # Auth sub-pages (sign-up, forgot-password, update-password, error)
│   ├── (dashboard)/              # Team layout group (role: "team")
│   │   └── dashboard/
│   │       ├── page.tsx          # Dashboard home — StatCards + TodaysTasks + QuickActions
│   │       ├── layout.tsx        # Dashboard shell with Nav + sidebar
│   │       ├── clients/          # CRM module
│   │       ├── projects/         # Projects + Phases + Tasks
│   │       ├── tasks/            # Standalone tasks module
│   │       ├── knowledge/        # Knowledge base (admin view)
│   │       ├── maintenance/      # Maintenance plans
│   │       ├── deliverables/     # Deliverables (team-facing)
│   │       └── menu/             # Menu module
│   ├── (portal)/                 # Client portal layout group (role: "client")
│   │   └── portal/
│   │       ├── page.tsx          # Portal landing
│   │       ├── layout.tsx        # Portal shell
│   │       └── deliverables/     # Deliverables (client-facing, read+submit)
│   ├── api/
│   │   ├── maintenance/cron/     # Daily lifecycle cron for maintenance plans
│   │   └── push/notify/          # Push notification delivery cron
│   ├── globals.css               # Global styles + Tailwind theme variables
│   └── layout.tsx                # Root layout
│
├── components/
│   ├── auth/                     # Auth forms (login, signup, forgot-password)
│   ├── dashboard/
│   │   ├── Nav.tsx / MobileNav.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── UserMenu.tsx
│   │   ├── QuickAction.tsx
│   │   ├── StatCard.tsx
│   │   ├── TodaysTasks.tsx
│   │   ├── clients/              # Client list, CRM cards, detail tabs
│   │   ├── projects/             # TasksViewer (table/kanban/calendar), phase UI
│   │   ├── maintenance/          # MonthView, NewPlanForm
│   │   ├── deliverables/         # Deliverable management
│   │   └── tasks/                # Task filtering/grouping components
│   ├── knowledge/
│   │   ├── kb-browser.tsx        # KB folder tree + article list + offline sync
│   │   └── article-editor.tsx    # Novel rich-text editor
│   ├── portal/
│   │   └── MobileNav.tsx
│   ├── ui/                       # shadcn/ui primitives (button, card, dialog, badge, table, etc.)
│   └── pwa-init.tsx              # Service worker registration + push hook
│
├── lib/
│   ├── supabase/
│   │   ├── server.ts             # createClient() for SSR, createAdminClient() for cron/server actions
│   │   ├── client.ts             # createBrowserClient() for client components
│   │   └── proxy.ts              # Auth middleware — redirects by role
│   ├── kb-offline.ts             # IndexedDB interface for KB offline caching
│   ├── notifications/actions.ts  # Push notification helpers
│   ├── deliverables/types.ts     # All TypeScript types for deliverables module
│   └── utils.ts                  # cn(), formatMexPhone(), and other utilities
│
├── hooks/
│   └── use-push-notifications.ts # Browser push permission + subscription registration
│
├── public/
│   ├── manifest.json             # PWA manifest (start_url: /dashboard)
│   ├── sw.js                     # Service worker
│   └── icons/                   # App icons (192x192, 512x512)
│
├── vercel.json                   # Cron job configuration
└── .env.local                    # NEXT_PUBLIC_SUPABASE_URL, SUPABASE keys, VAPID keys
```

---

## Authentication & Role Routing

- **Auth provider**: Supabase Email (magic link preferred; password also supported)
- **Role storage**: `user_metadata.role` in Supabase Auth — values: `"team"` or `"client"`
- **Middleware** (`proxy.ts`): Reads session cookie, checks role, redirects:
  - `/dashboard/*` → requires `"team"`, else → `/login`
  - `/portal/*` → requires `"client"`, else → `/login`
  - `/login` → if already authenticated, redirect to appropriate home
- **Supabase clients**:
  - `createClient()` from `lib/supabase/server.ts` — for Server Components and Server Actions (uses cookies)
  - `createAdminClient()` — for cron routes that need to bypass RLS
  - `createBrowserClient()` from `lib/supabase/client.ts` — for Client Components

---

## Database Schema (Key Tables)

All statuses and priorities are centralized in `catalog_status` (never hardcoded as enums).

| Table | Key Fields | Notes |
|---|---|---|
| `profiles` | `id`, `full_name`, `avatar_url`, `role` | 1:1 with `auth.users` |
| `catalog_status` | `id`, `label`, `color`, `category`, `order` | `category` scopes values (e.g. `"task_status"`, `"client_status"`) |
| `clients` | `id`, `name`, `company`, `email`, `phone`, `status_id`, `assigned_to` | CRM records |
| `projects` | `id`, `client_id`, `name`, `phase`, `status_id`, `start_date`, `end_date` | `phase` is free text |
| `phases` | `id`, `project_id`, `name`, `order`, `status_id` | Ordered sequence inside a project |
| `tasks` | `id`, `phase_id`, `title`, `assignee_id`, `status_id`, `priority_id`, `due_date`, `estimated_hours` | Belongs to a phase |
| `maintenance_plans` | `id`, `client_id`, `type` (`spt`\|`recurrente`), `status`, `project_id` | Two plan types |
| `maintenance_months` | `id`, `plan_id`, `month_number`, `year`, `month`, `status` | One row per calendar month |
| `maintenance_tasks` | `id`, `month_id`, `week`, `title`, `status`, `completed_at` | 4 weeks × N tasks per month |
| `maintenance_metrics` | `id`, `month_id`, `sessions`, `ctr`, `pagespeed_mobile`, etc. | SEO/analytics per month |
| `maintenance_task_templates` | `id`, `week`, `title`, `order` | Seed data for new months |
| `kb_folders` | `id`, `name`, `parent_id`, `order` | Nested KB structure |
| `kb_articles` | `id`, `folder_id`, `title`, `slug`, `content` (JSON), `visibility`, `client_id`, `status` | Novel JSON content |
| `push_subscriptions` | `id`, `user_id`, `endpoint`, `p256dh`, `auth` | Browser push registrations |
| `task_notification_log` | `id`, `task_id`, `user_id`, `type`, `sent_at` | Deduplication for push |
| `notifications` | `id`, `user_id`, `title`, `body`, `read`, `url` | In-app notification inbox |
| `deliverables` | `id`, `client_id`, `title`, `type` (`form`\|`decision`), `status` | Deliverable templates |
| `deliverable_fields` | `id`, `deliverable_id`, `label`, `type`, `order` | Form field types: text, long_text, date, image, file |
| `deliverable_options` | `id`, `deliverable_id`, `label`, `order` | Decision options |
| `deliverable_sets` | `id`, `client_id`, `name` | Groups deliverables per client |
| `deliverable_field_responses` | `id`, `deliverable_id`, `field_id`, `value` | Client form responses |
| `deliverable_decision_responses` | `id`, `deliverable_id`, `option_id`, `comment` | Client decisions |

---

## Key Modules & Status

### ✅ Done
- **Auth** — Magic link + password, role routing, cookie-based sessions
- **CRM (Clients)** — List (sortable table), client detail (tabs: projects, tasks, deliverables, maintenance), new/edit via sheet
- **Projects** — List (grid cards), project detail, phases, tasks
- **Tasks** — Three visualization modes:
  - **Table view** — Sortable, inline status changes
  - **Kanban view** — Drag-and-drop columns by `catalog_status` using `@dnd-kit`
  - **Calendar view** — Due-date grid
- **Knowledge Base** — Nested folders, Novel rich-text editor, offline-first (IndexedDB), sync on reconnect
- **Maintenance — Cron lifecycle** — Daily cron at 6 AM UTC; creates new month + seeds tasks on 1st, closes/archives at end of month
- **Push Notifications** — Morning digest, 24h task reminder, 1h reminder via VAPID + web-push
- **Client Portal shell** — Layout, portal home, mobile nav

### 🔄 In Progress
- **Maintenance Plans (detail UI)** — MonthView component, metrics input, task completion
- **Maintenance DOCX reports** — Auto-generated 3 days before month-end, stored in Supabase Storage
- **Deliverables module** — Form & decision types, team-facing CRUD, client-facing submit flow

### 📋 Backlog (v2)
- Client portal — project visibility (read-only phases + tasks)
- Client portal — Knowledge Base section
- Payments / Invoicing module
- Contract signing
- Time tracking per task
- Client invitation flow from dashboard
- Resend email integration (templates for portal invitation, deliverable updates)
- Vercel Analytics activation
- Full-text search on Knowledge Base (Supabase GIN index, Spanish language)

---

## Design System

**Dashboard (Dark theme):**
- Background: dark grays (`bg-gray-950`, `bg-gray-900`)
- Borders: subtle white-opacity lines
- **Brand accent**: Amber — `#f59e0b` (Tailwind `amber-500`)
- Typography: **Cal Sans** (headings), **DM Sans** (body)
- Components: shadcn/ui `new-york` style variant

**Portal (Light theme):**
- White header, clean bright backgrounds
- Same typography as dashboard

**CSS:**
- Tailwind CSS v4 with `@theme` custom variables in `globals.css`
- ProseMirror editor styles scoped in `globals.css`
- Use `cn()` from `lib/utils.ts` for conditional class merging

**Conventions:**
- All status badges use `catalog_status.color` (a hex string) to style dynamically — never hardcode status colors
- Use `shadcn/ui Sheet` for create/edit forms (lateral slide-in panels)
- Use `shadcn/ui Dialog` for confirmations and small modals
- Use `lucide-react` for all icons

---

## Coding Conventions & Patterns

### Supabase Queries
Always use the correct client for the context:
```ts
// Server Component or Server Action:
import { createClient } from "@/lib/supabase/server"
const supabase = await createClient()

// Client Component:
import { createBrowserClient } from "@supabase/ssr"
// or use the wrapper from lib/supabase/client.ts

// Cron routes (bypass RLS):
import { createAdminClient } from "@/lib/supabase/server"
const supabase = createAdminClient()
```

### catalog_status Pattern
Never hardcode status labels or colors as enums. Always fetch from `catalog_status` filtered by `category`:
```ts
const { data: statuses } = await supabase
  .from("catalog_status")
  .select("*")
  .eq("category", "task_status")
  .order("order")
```

### Server Actions
Prefer Next.js Server Actions (`"use server"`) for mutations. Co-locate `actions.ts` with the relevant route:
```
app/(dashboard)/dashboard/clients/[id]/deliverables/actions.ts
```

### Component Pattern
- Server Components by default — only add `"use client"` when state, events, or browser APIs are needed
- Keep data fetching in Server Components; pass data down as props
- For drag-and-drop (Kanban), the entire board must be a Client Component

### Maintenance Plan Types
- **SPT (Sistema Presencia Total)**: Fixed 5-month package. All 5 months created upfront at activation. Auto-completes at month 5.
- **Recurrente**: Ongoing monthly. One month created at start. Subsequent months auto-created on the 1st via cron at `/api/maintenance/cron`.

### KB Offline Strategy (IndexedDB via `lib/kb-offline.ts`)
Key functions:
- `getCachedFolders()` / `getCachedArticles()` — Read from IndexedDB
- `cacheFolders(data)` / `cacheArticles(data)` — Write to IndexedDB
- `queuePendingUpdate(articleId, content)` — Queue offline edits
- `syncArticles(supabase)` — Flush pending updates to Supabase on reconnect
- `getLastSyncTimestamp()` — Track freshness

### Push Notification Flow
1. `pwa-init.tsx` registers service worker + calls `use-push-notifications.ts`
2. Hook requests browser permission → registers subscription → `POST /api/push/subscribe`
3. Vercel cron triggers `GET /api/push/notify` (runs 2 PM + 10 PM UTC per `vercel.json`)
4. Cron fetches tasks due today/tomorrow, deduplicates via `task_notification_log`, sends via `web-push`
5. Service worker (`public/sw.js`) handles `push` event → shows notification; `notificationclick` → opens URL

---

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=          # Supabase project URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=  # Anon/publishable key (client-safe)
SUPABASE_SERVICE_ROLE_KEY=         # Admin key — server-only, never expose
SUPABASE_SECRET_KEY=               # Alternate admin key for cron routes
NEXT_PUBLIC_VAPID_PUBLIC_KEY=      # VAPID public key for push
VAPID_PRIVATE_KEY=                 # VAPID private key — server-only
NEXT_PUBLIC_SITE_URL=              # App domain for magic link redirects
```

---

## Vercel Cron Jobs (vercel.json)

```json
{
  "crons": [
    { "path": "/api/maintenance/cron", "schedule": "0 6 * * *" },
    { "path": "/api/push/notify",      "schedule": "0 14 * * *" },
    { "path": "/api/push/notify",      "schedule": "0 22 * * *" }
  ]
}
```

Times are UTC. MX timezone is UTC-6 (CST), so 6 AM UTC = midnight MX, 2 PM UTC = 8 AM MX, 10 PM UTC = 4 PM MX.

---

## PWA Configuration

- **Manifest**: `public/manifest.json` — `start_url: /dashboard`, display: `standalone`, theme: `#1e1e1e`
- **Service Worker** (`public/sw.js`) cache strategies:
  - `/_next/static/*` → **Cache-first** (immutable assets)
  - `/dashboard/knowledge*` → **Stale-while-revalidate** (KB offline support)
  - `/dashboard/*` → **Network-first** (fresh data preferred)
- **Next.js config** sets correct cache headers for SW and manifest files

---

## Business Context

- **Company**: DevWorks Studio, Piedras Negras, Coahuila, México
- **Developer/Owner**: Angel
- **Language**: The UI is in **Spanish**. All status labels, button text, error messages, headings, and user-facing copy should be in Spanish unless a technical term has no natural translation.
- **Client base**: Small-to-medium local businesses. The portal must be simple enough for non-technical clients.
- **Maintenance plans**: Core revenue product. SPT and Recurrente plans are the primary offering. The maintenance module and its DOCX reports are high priority.

---

## Common Tasks & How to Approach Them

**Adding a new page to the dashboard:**
1. Create `app/(dashboard)/dashboard/<module>/page.tsx`
2. Fetch data server-side with `createClient()` from `lib/supabase/server`
3. Pass to client components as props
4. Add nav link in `components/dashboard/Nav.tsx` and `MobileNav.tsx`

**Adding a new Supabase table:**
1. Define SQL in Supabase SQL Editor
2. Enable RLS immediately
3. Add policies: team can do full CRUD, clients can only SELECT their own data
4. Add TypeScript types in the relevant `types.ts` or inline

**Adding a new status category:**
Insert rows into `catalog_status` with a new `category` string. Query them by category wherever needed.

**Creating a new sheet/form:**
Use `shadcn/ui Sheet` with a trigger button. Place the form logic in a `"use client"` component. Use Server Actions for the actual mutation.

**Working on the maintenance DOCX report:**
The report auto-generates 3 days before month-end. It should pull `maintenance_months` + `maintenance_tasks` + `maintenance_metrics` for the month and produce a branded Word document. Store the result in Supabase Storage under a predictable path like `maintenance/{plan_id}/{month_id}/report.docx`.

**Debugging auth issues:**
Check `proxy.ts` middleware first. Verify `user_metadata.role` is set correctly on the Supabase user. Check that cookie-based session is being read properly in Server Components via `createClient()`.

---

## References

- Project repo: `/sessions/eloquent-confident-feynman/mnt/devworks-portal` (mounted workspace)
- Development plan (Spanish): uploaded as `devworks-plan.docx`
- Supabase docs: https://supabase.com/docs
- Next.js App Router docs: https://nextjs.org/docs/app
- shadcn/ui: https://ui.shadcn.com
- Novel editor: https://novel.sh
- @dnd-kit: https://dndkit.com
