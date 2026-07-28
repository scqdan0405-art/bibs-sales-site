CREATE TABLE site_settings (
  id TEXT PRIMARY KEY,
  brand_name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  business_hours TEXT NOT NULL,
  privacy_policy TEXT NOT NULL,
  terms_note TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE price_items (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  price_yen INTEGER NOT NULL CHECK (price_yen >= 0),
  unit TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','published')),
  published_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE case_studies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  image_alt TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','published')),
  published_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE faqs (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','published')),
  published_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE inquiries (
  id TEXT PRIMARY KEY,
  public_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email_or_phone TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  desired_date TEXT NOT NULL,
  design_status TEXT NOT NULL,
  message TEXT NOT NULL,
  consent INTEGER NOT NULL CHECK (consent IN (0,1)),
  mail_status TEXT NOT NULL CHECK (mail_status IN ('pending','sent','failed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE inquiry_attachments (
  id TEXT PRIMARY KEY,
  inquiry_id TEXT NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE admin_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  failed_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  csrf_token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_inquiries_public_id ON inquiries(public_id);
CREATE INDEX idx_inquiries_created_at ON inquiries(created_at);
CREATE INDEX idx_attachments_inquiry_id ON inquiry_attachments(inquiry_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
