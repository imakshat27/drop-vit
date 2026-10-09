# Temporary live demo data

This is an explicitly authorized, reversible exhibition for prelaunch testing. It is separate from the development-only `db:seed` command and never replaces existing users, projects, votes or results.

Run against the database configured in the ignored `.env.local`:

```sh
npm run demo:seed -- --apply
```

The tool creates:

- Eight approved projects covering Projects, Open Source, Startups and Launches, including a curator pick.
- Four fictional builder profiles, project teams and 32 synthetic supporters.
- Eight entries in the existing current week, with 144 sample supports.
- A fictional previous-month weekly archive and monthly archive, with 156 matching historical supports, 32 ranking snapshots and 11 sample awards.
- Three sample recruiting roles and pending / changes requested / rejected moderation examples.

All public titles, profiles, awards and archive labels include `[Demo]`. Every fixture description identifies fictional test data. Emails use the reserved `.test` domain, passwords cannot authenticate, Google subjects and admin roles are absent. Existing VIT-only authentication remains intact. No verification or recruitment emails are sent; sample role links are non-deliverable and the existing UI identifies them as samples.

Repeated seeding is a no-op. It will not reset edits, inflate votes or enter fixtures in subsequent weeks. ID collisions or partially missing fixtures cause a rollback. Demo votes influence displayed test rankings while fixtures are present; they are not real student activity. Project URLs use `/projects/demo-drop-…`; profiles use `/builders/demo-drop-…`.

## Cleanup before launch

```sh
npm run demo:cleanup -- --apply
```

Without `--apply`, both commands print usage and make no changes. Cleanup removes the fixed demo IDs and their dependent rows, including real-user supports on demo projects and any later awards/results generated for those projects. It retains existing accounts, real projects and the shared current week. It refuses cleanup if non-demo content depends on a demo owner or archive. It is safe to rerun.

The schema intentionally makes earned history immutable. This administrative fixture tool temporarily disables only the named application triggers **inside one database transaction**, holds table locks against concurrent writes, operates on validated fixture IDs, then restores every trigger before committing. Foreign-key constraints stay enabled. Any failure rolls back both the data changes and temporary trigger settings. It checks that all expected protections are initially enabled. There is no permanent migration or runtime bypass; normal app writes remain protected. This exception is solely for the user's authorized temporary fixtures, not real historical records.

Public Cloudflare caches can retain the prior response for up to 60 seconds after seeding or cleanup. Refresh after that interval.
