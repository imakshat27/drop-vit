CREATE TABLE users (id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE, password_hash text NOT NULL, role text NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')), verified boolean NOT NULL DEFAULT false, bio text NOT NULL DEFAULT '', skills text[] NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE sessions (token_hash text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL);
CREATE TABLE verification_tokens (token_hash text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL);
CREATE TABLE projects (id text PRIMARY KEY, slug text NOT NULL UNIQUE, title text NOT NULL, tagline text NOT NULL, description text NOT NULL, category text NOT NULL CHECK(category IN ('Open Source','Projects','Startups','Launches')), owner_id text NOT NULL REFERENCES users(id), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','changes')), feedback text NOT NULL DEFAULT '', open_source boolean NOT NULL DEFAULT false, startup boolean NOT NULL DEFAULT false, launched boolean NOT NULL DEFAULT false, featured boolean NOT NULL DEFAULT false, website text NOT NULL DEFAULT '', github text NOT NULL DEFAULT '', demo text NOT NULL DEFAULT '', tech text[] NOT NULL DEFAULT '{}', color text NOT NULL DEFAULT 'lilac', symbol text NOT NULL DEFAULT 'orbit', details jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE members (project_id text NOT NULL REFERENCES projects(id), user_id text NOT NULL REFERENCES users(id), role text NOT NULL DEFAULT 'Maker', PRIMARY KEY(project_id,user_id));
CREATE TABLE periods (id text PRIMARY KEY, label text NOT NULL, kind text NOT NULL CHECK(kind IN ('weekly','monthly','yearly','all-time')), starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, locked_at timestamptz, formula text NOT NULL DEFAULT 'weekly-share-v1', CHECK(ends_at>starts_at));
CREATE TABLE entries (period_id text NOT NULL REFERENCES periods(id), project_id text NOT NULL REFERENCES projects(id), PRIMARY KEY(period_id,project_id));
CREATE TABLE supports (id text PRIMARY KEY, period_id text NOT NULL REFERENCES periods(id), project_id text NOT NULL REFERENCES projects(id), user_id text NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT one_support_per_project_week UNIQUE(period_id,project_id,user_id));
CREATE TABLE results (id text PRIMARY KEY, period_id text NOT NULL REFERENCES periods(id), project_id text NOT NULL REFERENCES projects(id), category text NOT NULL, rank integer NOT NULL CHECK(rank>0), support_count integer NOT NULL CHECK(support_count>=0), score double precision NOT NULL CHECK(score>=0), title_snapshot text NOT NULL, tagline_snapshot text NOT NULL, color_snapshot text NOT NULL, symbol_snapshot text NOT NULL, CONSTRAINT one_result UNIQUE(period_id,category,project_id), CONSTRAINT one_rank UNIQUE(period_id,category,rank));
CREATE TABLE awards (id text PRIMARY KEY, title text NOT NULL, description text NOT NULL, type text NOT NULL CHECK(type IN ('earned','special')), rarity text NOT NULL DEFAULT 'rare', project_id text NOT NULL REFERENCES projects(id), period_id text REFERENCES periods(id), icon text NOT NULL DEFAULT 'star', created_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT unique_project_award UNIQUE(project_id,title));
CREATE TABLE recruitments (id text PRIMARY KEY, project_id text NOT NULL REFERENCES projects(id), role text NOT NULL, description text NOT NULL, skills text[] NOT NULL, commitment text NOT NULL, compensation text NOT NULL, location text NOT NULL DEFAULT 'VIT Vellore / Remote', openings integer NOT NULL DEFAULT 1 CHECK(openings>0), application_url text NOT NULL, status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')));
CREATE TABLE audit (id text PRIMARY KEY, actor_id text NOT NULL REFERENCES users(id), action text NOT NULL, target_id text NOT NULL, note text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE rate_limits (key text PRIMARY KEY, attempts integer NOT NULL, reset_at timestamptz NOT NULL);
CREATE INDEX project_discovery ON projects(status,category);
CREATE INDEX support_counts ON supports(period_id,project_id);
CREATE INDEX result_periods ON results(period_id,category,rank);

CREATE FUNCTION protect_period() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF OLD.locked_at IS NOT NULL THEN RAISE EXCEPTION 'Locked periods are permanent'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER immutable_period BEFORE UPDATE OR DELETE ON periods FOR EACH ROW EXECUTE FUNCTION protect_period();
CREATE FUNCTION protect_results() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 RAISE EXCEPTION 'Ranking snapshots are immutable';
END $$;
CREATE TRIGGER immutable_result BEFORE UPDATE OR DELETE ON results FOR EACH ROW EXECUTE FUNCTION protect_results();
CREATE FUNCTION protect_awards() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 RAISE EXCEPTION 'Earned and awarded achievements are permanent';
END $$;
CREATE TRIGGER immutable_award BEFORE UPDATE OR DELETE ON awards FOR EACH ROW EXECUTE FUNCTION protect_awards();
CREATE FUNCTION guard_support() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE p periods; BEGIN
 SELECT * INTO p FROM periods WHERE id=NEW.period_id FOR UPDATE;
 IF p.kind<>'weekly' OR p.locked_at IS NOT NULL OR now()<p.starts_at OR now()>=p.ends_at THEN RAISE EXCEPTION 'Support period is closed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM users WHERE id=NEW.user_id AND verified=true) THEN RAISE EXCEPTION 'Verification required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM projects JOIN entries ON entries.project_id=projects.id WHERE projects.id=NEW.project_id AND projects.status='approved' AND entries.period_id=NEW.period_id) THEN RAISE EXCEPTION 'Project not eligible'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER valid_support BEFORE INSERT ON supports FOR EACH ROW EXECUTE FUNCTION guard_support();
CREATE FUNCTION guard_entry() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE p periods; BEGIN
 SELECT * INTO p FROM periods WHERE id=COALESCE(NEW.period_id,OLD.period_id) FOR UPDATE;
 IF p.kind<>'weekly' OR p.locked_at IS NOT NULL OR now()>=p.ends_at THEN RAISE EXCEPTION 'Weekly entry is closed'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 IF NOT EXISTS(SELECT 1 FROM projects WHERE id=NEW.project_id AND status='approved') THEN RAISE EXCEPTION 'Approval required'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER valid_entry BEFORE INSERT OR UPDATE OR DELETE ON entries FOR EACH ROW EXECUTE FUNCTION guard_entry();
CREATE FUNCTION protect_support() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Supports are permanent'; END $$;
CREATE TRIGGER immutable_support BEFORE UPDATE OR DELETE ON supports FOR EACH ROW EXECUTE FUNCTION protect_support();
CREATE FUNCTION guard_result() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF EXISTS(SELECT 1 FROM periods WHERE id=NEW.period_id AND locked_at IS NOT NULL) THEN RAISE EXCEPTION 'Cannot add to locked rankings'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER valid_result BEFORE INSERT ON results FOR EACH ROW EXECUTE FUNCTION guard_result();
