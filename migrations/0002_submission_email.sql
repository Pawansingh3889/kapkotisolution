ALTER TABLE submissions ADD COLUMN email_sent_at TEXT;
CREATE INDEX submissions_pending_email ON submissions(created_at) WHERE email_sent_at IS NULL;
