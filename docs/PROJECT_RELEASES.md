# Scheduled project releases

Approval does not publish a project. Review schedules the first weekly Drop; the build becomes public when that edition's `starts_at` arrives (normally Sunday, 00:00 IST).

`src/lib/project-release.ts` defines the shared rule. Public access requires approved status and a started weekly entry. Locked weekly results also establish release for imported historical projects. An approved build without a date stays private. Later weekly re-entries never hide a build that has already released.

Apply this rule to every public project query, including discovery, featured projects, recruitment, team profiles and uploaded media. Future periods never contribute live rankings and are absent from public edition selectors. Private project URLs return the normal unavailable page to other visitors; their metadata does not expose the title.

Owners and curators can preview scheduled builds privately. The workshop and preview show the release date and time in IST. Share actions become available at release. Curator tools retain access to scheduled projects for moderation and planning.

Cloudflare document cache keys roll over at the weekly boundary; media cache keys include the deployment version so an older visibility policy cannot serve stale public images after a fix. No publication cron or second approval is required.

Regression coverage: `tests/project-release.test.ts`, `tests/e2e/release.spec.ts`, the submission/review flow, and media cache policy tests.
