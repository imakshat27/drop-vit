CREATE TABLE notification_outbox (
  id text PRIMARY KEY,
  event_key text NOT NULL UNIQUE,
  kind text NOT NULL CHECK (kind IN ('submission', 'review', 'live')),
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_id text REFERENCES periods(id) ON DELETE CASCADE,
  recipient text NOT NULL,
  payload jsonb NOT NULL,
  available_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  cancelled_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  lease_token text,
  leased_until timestamptz,
  last_error text
);
CREATE INDEX notification_outbox_due ON notification_outbox(available_at) WHERE sent_at IS NULL AND cancelled_at IS NULL;
