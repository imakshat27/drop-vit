# Sunday launch

The first Drop opens **Sunday, 25 October 2026, 00:00 IST**. Weekly exhibitions run Sunday 00:00 through the following Sunday 00:00 IST. `DROP_FIRST_RELEASE_AT` controls the initial date, defaulting to `2026-10-24T18:30:00Z`. Do not move it after launch without a data migration plan.

Before launch, week preparation creates the first and following Sundays; it does not create a pretend current exhibition before the launch date. Approval schedules the next upcoming Sunday. Public visibility begins at that edition's opening time. Shared document cache keys change at the same Sunday boundary.

The hero shows up to three ranked builds from the most recently locked weekly edition. If no weekly edition has closed, it uses this week's current ranking. It never fills empty positions from unrelated weeks. Each card shows the first uploaded image, with the existing illustration as a missing/broken-cover fallback. Once a new Drop closes, its recorded top three replace the previous hero lineup.

Empty discovery, weekly, honors, recruitment, builder and homepage sections explain the first release date. The empty hero has an invitation to submit a build. After launch, empty sections explain that the first exhibition is open.

## One-time content reset

`npm run launch:reset` previews counts. `npm run launch:reset -- --apply` removes all projects, editions, votes, results, awards, teams, roles, moderation logs, obsolete verification tokens and rate limits. It removes known fictional demo accounts and deletes all image/staging objects from the dedicated project-image bucket. It preserves real users, their sessions, curator roles, schema, migrations and service configuration.

This is an intentionally destructive launch-only operator command. It is not part of deployment, migrations, scheduled jobs or normal cleanup. Database changes are atomic; a storage failure must be checked and retried separately. The dedicated bucket is listed before any database change; unexpected object keys abort the operation. Database protections remain enabled.

When resetting a running site, deploy the Sunday calendar first, reset the content, then rotate the worker cache namespace and redeploy so no cached test listings or image responses remain reachable. Verify zero project/result rows, zero stored objects, preserved curators, and only Sunday weekly periods before announcing launch readiness.

QA uses an earlier launch date to exercise established exhibitions. `playwright.launch.config.ts` uses an empty isolated database and a future Sunday to check the actual pre-launch experience at mobile and desktop widths.
