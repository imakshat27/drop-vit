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

PostgreSQL uses request-scoped pools in Workers and closes connections after each checkout; this prevents sockets being reused across Worker requests. Normal Node development retains its shared pool.

## Publish

Authenticate with `npx wrangler login`. Keep the three credentials above in Cloudflare Worker secrets. Non-secret runtime settings are in `wrangler.jsonc`. Never upload the full local dotenv file: the direct migration URL and demo password are unnecessary in the Worker.

After building, `npm run deploy:cloudflare` publishes the Worker. For an initial deploy, Wrangler also accepts `--secrets-file` with an ignored JSON file containing only those three keys. Delete the temporary file afterward. Keep `.dev.vars` for local preview only.

While DNS activation is pending, deploy with `--var APP_URL:https://drop-vit.agarwalakshat2710.workers.dev` so verification links use the working origin. Before attaching the custom domain, remove the conflicting apex A/CNAME records in Cloudflare DNS. Preserve email records. Add this entry to `wrangler.jsonc`, set `APP_URL=https://droppp.tech`, and redeploy:

```json
"routes": [{ "pattern": "droppp.tech", "custom_domain": true }]
```

The updated `APP_URL=https://droppp.tech` then becomes the canonical verification origin. Cloudflare provisions the custom domain's DNS record and certificate. Domain activation requires the registrar to delegate to the exact nameservers assigned by Cloudflare.

Check public pages, account signup/signin, and verification delivery after deployment. `npm run services:check` verifies database schema and SMTP authentication from Node without sending mail. The local app keeps `APP_URL=http://localhost:3000` in `.env.local`.
