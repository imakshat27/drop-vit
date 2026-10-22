# Transactional email

Drop sends three owner-only notifications through the configured Brevo SMTP sender:

- **Submission received:** after each successful submission or resubmission. Links to the private workshop.
- **Review update:** approval with its scheduled date/time in IST, requested changes, or rejection, including the curator's note. Links to the workshop. Open-source requirements and release privacy are unchanged.
- **Build live:** once per build, when its scheduled weekly edition has opened. Links to the public build and points makers toward the existing share cards.

Google continues to verify account emails. No verification emails, digests, awards or marketing emails are enabled by this feature.

## Delivery

`notification_outbox` is written in the same database transaction as the submission or review. A failed transaction cannot leave a queued message behind. Approval also queues a future live notification with a unique `live:<project-id>` event key; future re-entries do not generate another launch email.

After the response, the app kicks delivery through its existing Worker self-service binding. `/api/internal/notifications` is POST-only and requires the server-only `NOTIFICATION_JOB_SECRET`. Each invocation processes one message, keeping SMTP work away from the visitor's render and CPU budget. Public GETs, caching and client bundles do not expose this key.

Cloudflare Cron runs at 18:30 and 18:31 UTC on Sunday (Monday 00:00 and 00:01 IST) for release notifications, plus hourly for recovery. A sweep selects up to 100 due messages and invokes at most four deliveries concurrently. Cron runs do not require someone to visit the site. They import only the delivery modules, not Next's application renderer.

Atomic leases prevent concurrent sends; expired leases recover after interrupted executions. Failures store only a sanitized error code, back off and retry up to six attempts. Sent or cancelled messages are not resent. Live delivery checks the project's approval and exact weekly entry again before sending. Deleting a project/account/edition removes dependent queued notifications. A stable Message-ID is reused during retries; SMTP cannot provide an absolute exactly-once guarantee across a successful send followed by a lost database acknowledgement.

Delivery errors do not undo the submitted project or saved review. The workshop remains the source of truth. Review/receipt emails snapshot the relevant title and feedback at the time of the event.

## Operations

Keep `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `APP_URL` and `NOTIFICATION_JOB_SECRET` configured on the Worker. Do not run the mailer against QA databases with real SMTP settings. QA tests inject a fake sender; browser fixtures keep SMTP disabled.

`CURATOR_EMAIL` now contains only the owner's configured VIT address. Other former curators were demoted in the database as well as removed from that login allowlist.

Three clearly labelled sample emails were sent at the owner's request. Demo previews use sample content and do not create submissions, approvals or public projects.

The private `/api/internal/notifications/verify` endpoint checks SMTP authentication in the actual Worker runtime; it requires the same job secret and sends no email.
