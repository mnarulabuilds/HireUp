# HireUp

Help people land jobs with structured resume building, job-match scoring, and interview coaching.

## Stack

- **apps/web** — Next.js 15 (App Router), SEO marketing pages + authenticated product UI
- **apps/api** — NestJS REST API (`/api/v1`), Passport OAuth + JWT cookies
- **packages/shared** — Zod schemas, entitlements, plan copy
- **PostgreSQL** via Docker Compose + Prisma

## Quick start

```bash
cp .env.example .env
cp .env apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
docker compose up -d
pnpm install
pnpm --filter @hireup/shared build
pnpm db:push
pnpm db:generate
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1/health
- Postgres: localhost:5433 (mapped from Docker to avoid clashing with local 5432)

Without OAuth credentials, use **Dev login** on `/login` (disabled in production).

## Features

- SSO: Google + GitHub (optional env keys) + local dev login
- Resume builders: forms, upload (PDF/DOCX/TXT), chat questionnaire
- ATS section controls (enable/order/headings), live suggestions, TXT + PDF export
- Job match scoring with OpenAI or deterministic heuristic fallback
- Plans: Free / Pro ($11) / Coach ($19) via Stripe Checkout
- Soft dashboard sponsored tip + donation CTA
- Unit tests: `pnpm test`

## Environment

See `.env.example` for `DATABASE_URL`, JWT, OAuth, OpenAI, and Stripe keys.
Missing OpenAI → heuristic scorer. Missing Stripe → billing endpoints return 503 with a clear message.
