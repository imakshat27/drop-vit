# Drop

**What VIT is building.** A curated student builder exhibition — projects are the main objects, and the Weekly Drop is its heartbeat.

## Run locally

Requires Node.js 24 or newer.

```sh
npm ci
cp .env.example .env.local
# Set SEED_DEMO_PASSWORD in .env.local before seeding if you want demo sign-in.
npm run db:migrate
npm run db:seed
npm run dev
```

Open <http://localhost:3000>. Without `DATABASE_URL`, Drop runs a persistent PGlite PostgreSQL engine in `.data/drop`. Stop the local app before running migrations/seeds against that same local database; PGlite is intended for one application process. Real PostgreSQL supports multiple application processes.

Sample accounts: `ananya@demo.drop.test` (builder) and `admin@demo.drop.test` (curator), using the password supplied to `SEED_DEMO_PASSWORD`. If no password is supplied, the seed generates an undisclosed random password and the demo accounts cannot be signed into. New account registration still works. Seed data is fictional and marked as such in the local exhibition; sample GitHub links point to contribution directories and sample recruitment email addresses are non-deliverable.

## Experience

- **Discover:** editorial homepage, last week’s champion, live weekly preview, visual category directory, project search, recruitment, and an honors teaser.
- **Weekly Drop:** IST-aligned Monday-to-Monday editions, closing countdown, 30-second refresh, verified support, current lineup, upcoming exhibition, and permanently locked archives.
- **Projects:** rich stories, project-specific illustrations, screenshot gallery with failure fallback, team, tech stack, open-source setup and contribution areas, startup stage, launch details, awards, ranking history, and attached roles. A single project can appear in multiple relevant categories.
- **Honors:** weekly, monthly, yearly, and all-time leaderboards; category filtering; immutable completed editions; Hall of Fame. Only projects compete. Recruitment does not enter ranking tables.
- **Builders:** work, contributions, skills, and permanent project achievements. No follower counts or user leaderboards. Private workshop includes submission status, curator feedback, profile editing, and email-verification state.
- **Submit:** four deliberate steps grouping category, story/media/team, relevant details, and preview. Draft values stay in memory between steps. Submitted builds remain private until reviewed; requested changes can be edited and resubmitted.
- **Curate:** server-authorized approval/rejection/change requests, category editing during review, next-week scheduling, featuring, permanent special badges, recruitment status, period locking, and audit history.

## Architecture and database

Next.js 16 App Router, React, TypeScript, Tailwind CSS, and Drizzle. Server Components load public data, Server Actions validate/authorize mutations, and small Client Components handle forms, countdowns, support, refresh, and navigation. No external fonts, analytics, or stock imagery are needed for the initial exhibition.

`src/lib/schema.ts` defines users, hashed sessions, expiring verification tokens, projects, team memberships, weekly entries, supports, ranking periods, immutable results, permanent awards, attached recruitment, rate limits, and curator audit events. Ordered transactional SQL migrations live in `migrations/`; the transactional seed is idempotent for an empty development database.

Database constraints and triggers enforce approval and verification, one support per user/project/week, voting windows, immutable supports, immutable ranking snapshots, permanent awards, and unchangeable locked periods. Weekly result insertion and support insertion share a period-row lock to serialize finalization. Approval and resubmission lock the project row to prevent conflicting reviews.

### Scoring

Weekly ranks use support count, with stable project-ID tie breaking. Each result stores raw support count and a category-relative weekly share. Monthly/yearly/all-time scores use the **average** weekly support share across a project’s eligible weeks, rather than accumulating lifetime votes. Only weeks fully contained within a parent period count; in-progress editions include the current week’s live share. Formula IDs (`weekly-support-v1`, `weekly-share-v1`) are stored with periods so future formulas can be versioned. A minimum-participation requirement or alternate normalized formula can be added for future editions without changing locked results.

Closed weekly editions finalize transactionally on the next exhibition-related request. Late support is rejected immediately by the database, regardless of traffic. Monthly/yearly editions are finalized explicitly by a curator after closing. Calendar periods and current/next weekly editions are created automatically. Locked results include project title, pitch, and visual snapshots so later edits cannot rewrite history. A scheduled finalizer can be added if wall-clock background finalization is needed.

### Authentication

Password hashes use salted scrypt. Sessions are random opaque tokens stored only as SHA-256 hashes, expire after seven days, and use HttpOnly / SameSite=Lax cookies with Secure in production. Server-side roles guard all curator mutations. Email verification uses hashed, single-use 24-hour tokens delivered through SMTP; GET requests never consume the token. Verification is required for support, while unverified builders may submit. Database-backed limits constrain repeated login, submission, support, and verification attempts. VIT-specific student verification remains separate from email verification.

## Deployment

Set `DATABASE_URL` to a real PostgreSQL connection string and `APP_URL` to your deployed origin (working domain: `https://droppp.tech`). Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` for verification delivery.

The recommended starter setup is Neon PostgreSQL and Brevo SMTP. See [the connection walkthrough](docs/SERVICES_SETUP.md). After setting credentials, run `npm run services:check` to check the remote database schema and SMTP authentication without sending mail. An optional `DATABASE_MIGRATION_URL` lets schema migrations use a direct connection while the app uses a pooled URL.

```sh
npm ci
npm run db:migrate
npm run build
npm run start
```

Do not seed demo accounts into production. The app requires `DATABASE_URL` in production. `ALLOW_LOCAL_DB=1` is an explicit escape hatch for local production testing only.

Provision a curator using `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD` (at least 14 characters for a new account), then run `npm run admin:create`. Existing accounts gain the role without changing their password or verification. Store credentials in your host’s secret manager or ignored environment file. The production app sends verification from its configured SMTP service.

For multiple server instances, use one shared PostgreSQL database and configure a stable `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` according to Next.js deployment guidance. Domain provisioning and publishing are separate from this local build.

## Verification

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm audit --omit=dev
```

The browser suite starts a production server on port 3100 with its own fresh PostgreSQL test directory. It covers support persistence, private review, requested changes and resubmission, approval and scheduling, unverified signup, badges, role management, profile edits, invalid verification links, mobile navigation, empty states, reduced motion, landscape, and overflow/automated accessibility across four widths. Test screenshots/traces are written to ignored `test-results/`. GitHub Actions repeats the checks on pushes and pull requests.

Production dependencies pass `npm audit --omit=dev`. The full audit currently reports the unpatched `braces` stack-exhaustion advisory through Next’s development-only ESLint glob dependencies. The latest registry release is still affected; lint runs fixed repository paths and these packages are not used by the production server. Track the upstream patch instead of downgrading Next to the unrelated version suggested by `npm audit --force`.

## Design and next steps

The UI UX Pro Max skill informed the composition and interaction system; decisions are persisted in `design-system/drop/MASTER.md`. Warm paper, confident solid colors, oversized type, illustrated project identities, editorial spacing, readable labels, mobile recomposition, keyboard focus, and reduced-motion support keep it closer to a builder exhibition than a dashboard.

Production uses Cloudflare Workers at `https://droppp.tech`, Neon PostgreSQL, and Brevo SMTP from `hello@droppp.tech`. Signup sends a branded verification email; resends have delivery feedback and database-backed limits. Email verification confirms mailbox ownership, not VIT student eligibility.

Sensible follow-ups: add VIT verification and password recovery; add hosted media uploads and GitHub issue synchronization; add a scheduled finalizer and operational email/DB monitoring. Profile-only build logs are intentionally deferred until the core experience has real usage. They must never enter global discovery.
