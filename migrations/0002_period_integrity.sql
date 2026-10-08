CREATE UNIQUE INDEX one_period_per_start ON periods(kind, starts_at);
CREATE OR REPLACE FUNCTION guard_result() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE locked timestamptz; BEGIN
 SELECT locked_at INTO locked FROM periods WHERE id=NEW.period_id FOR UPDATE;
 IF locked IS NOT NULL THEN RAISE EXCEPTION 'Cannot add to locked rankings'; END IF;
 RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION guard_entry() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE p periods; BEGIN
 IF TG_OP='UPDATE' AND (OLD.period_id<>NEW.period_id OR OLD.project_id<>NEW.project_id) THEN RAISE EXCEPTION 'Weekly entries cannot be moved'; END IF;
 SELECT * INTO p FROM periods WHERE id=COALESCE(NEW.period_id,OLD.period_id) FOR UPDATE;
 IF p.kind<>'weekly' OR p.locked_at IS NOT NULL OR now()>=p.ends_at THEN RAISE EXCEPTION 'Weekly entry is closed'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 IF NOT EXISTS(SELECT 1 FROM projects WHERE id=NEW.project_id AND status='approved') THEN RAISE EXCEPTION 'Approval required'; END IF;
 RETURN NEW; END $$;
