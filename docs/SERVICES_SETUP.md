# PostgreSQL and SMTP setup

Use Neon for managed PostgreSQL and Brevo for transactional verification mail. Both connect through the app's existing standard protocols. Keep credentials in the ignored root `.env.local` for local development and the hosting provider's secret settings for deployment.

## 1. Neon

1. Sign in at https://console.neon.tech and create a Free project named `drop-vit`. Choose a region close to the eventual app server. If the server region is undecided, decide it before creating the production database.
2. Use a dedicated production database/branch. Keep local fictional demo data separate.
3. In Connect, copy the pooled PostgreSQL connection string to `DATABASE_URL`. Preserve the provider's TLS query parameters and URL-encoded password.
4. Copy the direct connection string for the same database/branch to `DATABASE_MIGRATION_URL`. If using `neon env pull --service postgres`, the CLI writes `DATABASE_URL_UNPOOLED` instead; migrations automatically use it unless `DATABASE_MIGRATION_URL` overrides it.
5. Run `npm run db:migrate`. Do **not** run `db:seed` on production. Migrations create the application schema; real accounts and projects start empty.

Reference: https://neon.com/docs/get-started/connect-neon

## 2. Brevo

1. Sign in at https://www.brevo.com and select the Free plan.
2. Add `droppp.tech` as a sending domain. Add the exact authentication records displayed by Brevo to your DNS provider; preserve existing records for other mail services. Wait until Brevo confirms verification. Follow the domain authentication records displayed by Brevo, including its verification code, DKIM, and DMARC guidance.
3. Under SMTP & API → SMTP, copy the displayed SMTP login into `SMTP_USER`. Generate an SMTP key and save it as `SMTP_PASSWORD` (not an API key or account password).
4. Set these values in `.env.local` (keep the actual API key out of Git):

```dotenv
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=<your displayed Brevo SMTP login>
SMTP_PASSWORD=<your Brevo SMTP key>
SMTP_FROM="Drop <hello@droppp.tech>"
```

Port 587 uses required STARTTLS; ports 465/2465 use implicit TLS. Certificate verification stays enabled. Free currently permits 300 email sends/day, with no rollover; a campus-wide signup burst may need a paid plan. Check the provider's current limits before launch.

References: https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP and https://help.brevo.com/hc/en-us/articles/208589409-About-Brevo-s-pricing-plans

## 3. Verify and start

Keep `APP_URL=http://localhost:3000` while testing locally. Set it to `https://droppp.tech` in the deployed environment so Google callbacks point to the right app. Do not prefix database or SMTP secrets with `NEXT_PUBLIC_`.

```sh
npm run services:check
npm run db:migrate
npm run services:check
```

The check performs read-only database queries and SMTP connection/authentication verification. It fails until the remote database has all migrations. It never opens the local PGlite database, prints secrets, or sends a message. Successful SMTP authentication does not prove that a sender domain is approved or mail reaches an inbox.

Restart the dev server after changing credentials. Sign in with your own VIT Google account to test the callback and verified session. Password and verification-email flows are disabled. To provision a curator, set an explicitly authorized `CURATOR_EMAIL` before Google sign-in, or sign in first and run `npm run admin:create` with that account’s `ADMIN_EMAIL`.

Changing `DATABASE_URL` switches the app to a fresh database; it does not transfer `.data/drop` or its demo accounts. The local data stays on disk. Use a separate Neon development branch for future testing against PostgreSQL rather than exercising mutations on production.

## Agent tooling

Neon skills are installed in `.agents/skills/neon*` and pinned by `skills-lock.json`. Project-level Codex MCP settings are in `.codex/config.toml`, using OAuth and restricted to project `restless-cherry-21622170`. The agent may request sign-in on first MCP use; new skills/server configuration may require a new Codex turn or restart. Existing global configuration remains separate.

The local ignored `.neon` context pins the production branch. `neon.ts` contains an empty policy preserving existing services/settings. `neon deploy` reconciles that policy; it does not publish this Next.js frontend. For later development, use a separate Neon branch and refresh both pooled/direct URLs together.
