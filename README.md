# JB Portal Admin Application

Simple Next.js admin console for basic job management.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- Secure server-side route handlers as integration layer
- Zod for validation
- Vitest smoke tests

## What This App Delivers

### Authentication

- Admin login at `/login` with one local admin account.
- Signed cookie session using JWT (`httpOnly`, `sameSite=strict`, secure in production).
- Route protection for app pages via `proxy.ts`.
- Logout flow via `/api/auth/logout`.

### Core Module

- Jobs management (`/jobs`, `/jobs/new`, `/jobs/[id]/edit`)

### Simple Defaults

- Jobs use Supabase when configured; otherwise they fall back to in-memory storage.
- No separate backend API is required for login or job management.
- Strict security headers remain at the proxy level.

### Developer Foundations

- Feature-based app structure and reusable UI components.
- Shared model types for Job and Session user.
- Simple local route handlers for login and job CRUD.
- Smoke tests for auth guard and jobs CRUD routes.

## Folder Structure

```text
app/
  (auth)/login
  (admin)/jobs
  api/
    auth/
    jobs/
components/
  auth/
  jobs/
  layout/
  ui/
lib/
  auth/
  types/
  validation/
  storage/
tests/smoke/
proxy.ts
```

## Environment Variables

Copy `.env.example` to `.env.local` and set real secrets.

Required:

- `ADMIN_SESSION_SECRET`
- `ADMIN_SIMPLE_LOGIN_EMAIL`
- `ADMIN_SIMPLE_LOGIN_PASSWORD`

Optional:

- `ADMIN_SIMPLE_LOGIN_NAME` (defaults to `Admin`)
- `SUPABASE_URL` (enables database mode)
- `SUPABASE_SERVICE_ROLE_KEY` (server-side key for jobs CRUD)
- `SUPABASE_JOBS_TABLE` (defaults to `jobs`)

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env.local
# then edit .env.local with real values
```

3. Start dev server:

```bash
npm run dev -- --port 3001
```

4. Open:

- `http://localhost:3001/login`

### Quick Local Login

Add to `.env.local`:

```bash
ADMIN_SIMPLE_LOGIN_EMAIL=admin@test.com
ADMIN_SIMPLE_LOGIN_PASSWORD=Admin@12345
ADMIN_SIMPLE_LOGIN_NAME=Local Admin
```

Then sign in at `/login` with:

- Email: `admin@test.com`
- Password: `Admin@12345`

### Supabase Jobs Mode

Add these to `.env.local` to persist jobs in Supabase:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JOBS_TABLE=jobs
SUPABASE_APPLICATIONS_TABLE=applications
SUPABASE_SYNC_REQUIRED=true
SUPABASE_JOBS_UPSERT_ON_CREATE=true
SUPABASE_JOBS_UPSERT_CONFLICT_COLUMN=slug
```

Sync behavior with existing tables:

- Create job uses `upsert` by conflict column (default `slug`) so existing job rows are updated instead of duplicated.
- Update/publish/remove operate by `id`.
- Applications list/details/status/bulk-status read/write directly to `SUPABASE_APPLICATIONS_TABLE`.
- If `SUPABASE_SYNC_REQUIRED=true` and Supabase env vars are missing, API returns errors instead of silently using local memory.

Optional applications column overrides (when your table names differ):

- `SUPABASE_APPLICATIONS_STATUS_COLUMN`
- `SUPABASE_APPLICATIONS_ASSIGNEE_COLUMN`
- `SUPABASE_APPLICATIONS_NOTES_COLUMN`
- `SUPABASE_APPLICATIONS_COMMENTS_COLUMN`
- `SUPABASE_APPLICATIONS_UPDATED_BY_COLUMN`
- `SUPABASE_APPLICATIONS_UPDATED_AT_COLUMN`

Expected columns in `jobs` table:

- `id` (uuid/text)
- `title`, `slug`, `description`, `department`, `location`, `experience`
- `responsibilities` (text[] or json array)
- `requirements` (text[] or json array)
- `skills` (text[] or json array)
- `work_mode`, `employment_type`, `status`
- `salary_min`, `salary_max`, `salary_currency`
- `openings`, `archived_at`, `created_at`, `updated_at`, `updated_by`

## Build, Test, Lint

```bash
npm run lint
npm test
npm run build
```

## Production Checklist

- Set a strong `ADMIN_SESSION_SECRET`.
- Set `ADMIN_SIMPLE_LOGIN_EMAIL` and `ADMIN_SIMPLE_LOGIN_PASSWORD`.
- Ensure TLS and secure cookies are enabled in production.
- Keep the app behind your preferred access controls.

## Smoke Tests Included

- `tests/smoke/auth-guard.test.ts`
- `tests/smoke/jobs-crud.test.ts`
- `tests/smoke/public-jobs-api.test.ts`

## Public Careers Site Integration

This admin portal now exposes intentionally public, read-only APIs for a separate careers frontend.

### Endpoints

- `GET /api/public/jobs`
- `OPTIONS /api/public/jobs`
- `GET /api/public/jobs/:slug`
- `OPTIONS /api/public/jobs/:slug`

Both endpoints return only active (published) jobs. Draft and closed jobs are excluded.

### List Response

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "string",
        "slug": "string",
        "title": "string",
        "department": "Technical",
        "sector": "technical",
        "team": "",
        "location": "string",
        "workMode": "Remote",
        "experienceLevel": "Mid",
        "experienceRange": "1-3",
        "type": "Full-time",
        "salaryRange": "INR 6,00,000 - INR 9,00,000",
        "summary": "string",
        "skills": [],
        "postedDaysAgo": 0,
        "statusTags": ["Active"],
        "openings": 1,
        "responsibilities": [],
        "requiredQualifications": [],
        "aboutRole": [],
        "niceToHave": [],
        "perks": [],
        "interviewProcess": []
      }
    ],
    "total": 1
  }
}
```

### Detail Response

```json
{
  "ok": true,
  "data": {
    "id": "string",
    "slug": "string",
    "title": "string",
    "department": "Technical",
    "sector": "technical",
    "team": "",
    "location": "string",
    "workMode": "Remote",
    "experienceLevel": "Mid",
    "experienceRange": "1-3",
    "type": "Full-time",
    "salaryRange": "Salary based on experience",
    "summary": "string",
    "skills": [],
    "postedDaysAgo": 0,
    "statusTags": ["Active"],
    "openings": 1,
    "responsibilities": [],
    "requiredQualifications": [],
    "aboutRole": [],
    "niceToHave": [],
    "perks": [],
    "interviewProcess": []
  }
}
```

### Required Environment Variable

- `ADMIN_ALLOWED_ORIGINS` (comma-separated origins)

If the incoming `Origin` is in the allowlist, the API sets `Access-Control-Allow-Origin` to that exact origin with `Vary: Origin`.
The API always returns:

- `Access-Control-Allow-Methods: GET,OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`
- `Access-Control-Max-Age: 86400`

### Curl Examples

```bash
curl -i https://your-admin-domain/api/public/jobs
curl -i https://your-admin-domain/api/public/jobs/frontend-engineer
curl -i -X OPTIONS https://your-admin-domain/api/public/jobs \
  -H "Origin: https://creinx-careers.vercel.app"
curl -i -X OPTIONS https://your-admin-domain/api/public/jobs/frontend-engineer \
  -H "Origin: https://creinx-careers.vercel.app"
```

## Implemented Features vs Pending Enhancements

### Implemented

- Secure login/session/logout flow.
- Single-admin route protection.
- Jobs list, filtering, sorting, pagination, create/edit, publish/unpublish, duplicate, remove.
- Supabase-backed jobs persistence (with in-memory fallback when Supabase is not configured).
- Reusable data table, filter bar, pagination, confirmation modal, and UI states.

### Pending Enhancements

- Rich text editor for job descriptions.
