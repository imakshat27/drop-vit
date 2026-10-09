# Cloudflare deployment

Drop runs on Cloudflare Workers through OpenNext, with Neon PostgreSQL and Brevo SMTP. The intended custom domain is `droppp.tech`; the sender is `hello@droppp.tech`.

## Build and preview

```sh
npm ci
npm run build:cloudflare
npm run preview:cloudflare -- --port 8787
```

Put `DATABASE_URL`, `SMTP_USER`, and `SMTP_PASSWORD` in ignored `.dev.vars` for preview. Use an isolated Neon branch for tests that create users or projects. Never seed production.

The build backports OpenNext's upstream Next.js 16.4 preview-manifest fix until the installed adapter includes it. It also removes OpenNext's embedded dotenv values so server configuration comes exclusively from Worker bindings and secrets. Public client environment variables, if introduced later, still require a build.

PostgreSQL uses request-scoped `pg` pools in Workers, backed by the free `drop-neon` Hyperdrive binding. Hyperdrive maintains origin connections to Neon, removing repeated TLS/SCRAM authentication work from the Worker. Its query cache is disabled: account checks, votes, and transactions always reach PostgreSQL. Each request closes its own pool after the complete response; sockets are never shared between Worker requests. Normal Node development retains its shared pool and uses `DATABASE_URL`.

For local Worker preview, also put `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` in ignored `.dev.vars`, using your test database connection string. The preview/deploy scripts load this before OpenNext creates its local binding proxy. This local string is not the deployed origin configuration. Hyperdrive's free plan allows 100,000 database statements per day and rejects excess usage; no paid subscription was enabled.

## Publish

Authenticate with `npx wrangler login`. Keep the three credentials above in Cloudflare Worker secrets. Non-secret runtime settings are in `wrangler.jsonc`. Never upload the full local dotenv file: the direct migration URL and demo password are unnecessary in the Worker.

After building, `npm run deploy:cloudflare` publishes the Worker. For an initial deploy, Wrangler also accepts `--secrets-file` with an ignored JSON file containing only those three keys. Delete the temporary file afterward. Keep `.dev.vars` for local preview only.

The custom domain `droppp.tech` is attached to the Worker and its route is preserved in `wrangler.jsonc`. `APP_URL=https://droppp.tech` sets the origin for verification links. Cloudflare manages its DNS record and TLS certificate. The workers.dev address remains available for diagnostics.

Check public pages, account signup/signin, and verification delivery after deployment. `npm run services:check` verifies database schema and SMTP authentication from Node without sending mail. The local app keeps `APP_URL=http://localhost:3000` in `.env.local`.
