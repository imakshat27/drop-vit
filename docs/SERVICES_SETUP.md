# PostgreSQL and SMTP setup

Use Neon for managed PostgreSQL and Resend for transactional verification mail. Both connect through the app's existing standard protocols. Keep credentials in the ignored root `.env.local` for local development and the hosting provider's secret settings for deployment.

## 1. Neon

1. Sign in at https://console.neon.tech and create a Free project named `drop-vit`. Choose a region close to the eventual app server. If the server region is undecided, decide it before creating the production database.
2. Use a dedicated production database/branch. Keep local fictional demo data separate.
3. In Connect, copy the pooled PostgreSQL connection string to `DATABASE_URL`. Preserve the provider's TLS query parameters and URL-encoded password.
4. Copy the direct connection string for the same database/branch to `DATABASE_MIGRATION_URL`. This is optional, but keeps migration connections separate from the app pool.
5. Run `npm run db:migrate`. Do **not** run `db:seed` on production. Migrations create the application schema; real accounts and projects start empty.

Reference: https://neon.com/docs/get-started/connect-neon

## 2. Resend

1. Sign in at https://resend.com and select the Free plan.
2. Add `drop.aksht.site` as a sending domain. Add the exact SPF/DKIM records displayed by Resend to your DNS provider; preserve existing records for other mail services. Wait until Resend confirms verification. Follow its recommended DMARC configuration for the sending domain.
3. Create a sending API key for this domain and save it as `SMTP_PASSWORD`.
4. Set these values in `.env.local` (keep the actual API key out of Git):

```dotenv
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=<your Resend API key>
SMTP_FROM="Drop <hello@drop.aksht.site>"
```

Port 587 uses required STARTTLS; ports 465/2465 use implicit TLS. Certificate verification stays enabled. Free currently permits 3,000 transactional emails/month and 100/day; a campus-wide signup burst may need a paid plan. Check the provider's current limits before launch.

References: https://resend.com/docs/send-with-smtp and https://resend.com/pricing

## 3. Verify and start

Keep `APP_URL=http://localhost:3000` while testing locally. Set it to `https://drop.aksht.site` in the deployed environment so verification links point to the right app. Do not prefix database or SMTP secrets with `NEXT_PUBLIC_`.

```sh
npm run services:check
npm run db:migrate
npm run services:check
```

The check performs read-only database queries and SMTP connection/authentication verification. It fails until the remote database has all migrations. It never opens the local PGlite database, prints secrets, or sends a message. Successful SMTP authentication does not prove that a sender domain is approved or mail reaches an inbox.

Restart the dev server after changing credentials. Register with an email address you own and confirm the delivered link to test the full verification flow. Production requires a curator; provision one with `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD`, then run `npm run admin:create`. Do not reuse the local demo password.

Changing `DATABASE_URL` switches the app to a fresh database; it does not transfer `.data/drop` or its demo accounts. The local data stays on disk. Use a separate Neon development branch for future testing against PostgreSQL rather than exercising mutations on production.
