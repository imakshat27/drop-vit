ALTER TABLE users ADD COLUMN google_subject text;
CREATE UNIQUE INDEX users_google_subject_unique ON users (google_subject);
