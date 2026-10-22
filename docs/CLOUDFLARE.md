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

Pools handle background socket errors explicitly; `pg` removes the failed idle connection, and the app records a credential-free warning. Request cleanup closes each pool once and catches cleanup failures. Active query/transaction errors still reject normally. This avoids an idle socket error turning into an unhandled rejection after an otherwise successful response.

For local Worker preview, also put `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` in ignored `.dev.vars`, using your test database connection string. The preview/deploy scripts load this before OpenNext creates its local binding proxy. This local string is not the deployed origin configuration. Hyperdrive's free plan allows 100,000 database statements per day and rejects excess usage; no paid subscription was enabled.

## Free-tier CPU optimisation

`cloudflare/worker.mjs` checks Cloudflare's Cache API before importing the OpenNext handler. Successful anonymous GET responses on public discovery, exhibition, recruitment, project, and builder pages are cached for 60 seconds. HTML and RSC/router variants have separate keys. Build IDs isolate deployments, and keys rotate at Sunday 00:00 IST so a new weekly edition cannot receive the previous week's cached response.

Any cookie, Authorization header, server action, private route, verification route, OAuth route, unknown query parameter, or explicit no-cache request bypasses this cache. Responses setting cookies, redirecting, or returning errors are never stored. The origin render receives a constrained set of headers to prevent cache poisoning. Browsers receive `private, no-store`; this is an edge-only cache, not a browser cache. `x-drop-cache: HIT/MISS` is available for diagnosis on eligible responses. Next's `_rsc` navigation hash must remain on the actual render request even though the edge key uses the router-header digest instead.

Account checks and voting transactions remain live. Public displays may lag by up to 60 seconds; open-tab rankings refresh every two minutes, with immediate action feedback. Private navbar links do not prefetch expensive account/submission pages.

Live cache hits measured 0–2 ms CPU, versus tens to hundreds of milliseconds for full uncached renders. Cache misses and authenticated requests still run Next.js and can exceed the free plan's 10 ms CPU budget; this reduces the failure risk but does not guarantee every request fits. The Cache API is local to each Cloudflare data center, so a new location needs its own warm entry. No paid plan was enabled.

## In-app failure recovery

Client instrumentation guards same-origin RSC GET requests. A network failure, HTTP 429, or HTTP 5xx waits for a manual retry and shows a compact notification; proxy HTML never reaches Next's fallback that would navigate the browser to Cloudflare's error document. The app shell remains available, although the target page may show its loading placeholder. Aborted requests leave the retry queue. This applies to navigation, prefetch, and refresh reads, with no automatic retry loop.

Server action failures return an inline error and a notification, preserving form inputs. Writes are never automatically replayed: a lost response might mean the write already committed, so the message asks the user to check first. Next's render error boundaries use `retry` to refetch their segment.

This cannot replace a Cloudflare resource-limit response on an initial visit or full reload before client code runs. It improves recovery within an already loaded app and does not remove the underlying CPU limit.

## Publish

Authenticate with `npx wrangler login`. Keep the three credentials above in Cloudflare Worker secrets. Non-secret runtime settings are in `wrangler.jsonc`. Never upload the full local dotenv file: the direct migration URL and demo password are unnecessary in the Worker.

After building, `npm run deploy:cloudflare` publishes the Worker. For an initial deploy, Wrangler also accepts `--secrets-file` with an ignored JSON file containing only those three keys. Delete the temporary file afterward. Keep `.dev.vars` for local preview only.

The custom domain `droppp.tech` is attached to the Worker and its route is preserved in `wrangler.jsonc`. `APP_URL=https://droppp.tech` sets the origin for verification links. Cloudflare manages its DNS record and TLS certificate. The workers.dev address remains available for diagnostics.

Check public pages, account signup/signin, and verification delivery after deployment. `npm run services:check` verifies database schema and SMTP authentication from Node without sending mail. The local app keeps `APP_URL=http://localhost:3000` in `.env.local`.
