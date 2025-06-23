# Status System Migration SQL

This migration script will drop old status tables and create a comprehensive, modern status system. It includes tables, policies, functions, and triggers for full functionality and security.

---

## 1. Drop Old Tables

```sql
DROP TABLE IF EXISTS public.status_reactions CASCADE;
DROP TABLE IF EXISTS public.status_views CASCADE;
DROP TABLE IF EXISTS public.status_updates CASCADE;
```

---

## 2. Create Tables

```sql
-- Status Updates Table
CREATE TABLE public.status_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  is_public boolean NOT NULL DEFAULT true,
  reply_to_status_id uuid REFERENCES public.status_updates(id) ON DELETE SET NULL,
  extra jsonb DEFAULT '{}'::jsonb
);

-- Status Media Table
CREATE TABLE public.status_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status_id uuid NOT NULL REFERENCES public.status_updates(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type varchar(20) NOT NULL,
  position int NOT NULL DEFAULT 0
);

-- Status Reactions Table
CREATE TABLE public.status_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status_id uuid NOT NULL REFERENCES public.status_updates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji varchar(10) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT status_reactions_status_id_user_id_key UNIQUE (status_id, user_id)
);

-- Status Views Table
CREATE TABLE public.status_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status_id uuid NOT NULL REFERENCES public.status_updates(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT status_views_status_id_viewer_id_key UNIQUE (status_id, viewer_id)
);
```

---

## 3. Indexes

```sql
CREATE INDEX idx_status_updates_user_id ON public.status_updates(user_id);
CREATE INDEX idx_status_media_status_id ON public.status_media(status_id);
CREATE INDEX idx_status_reactions_status_id ON public.status_reactions(status_id);
CREATE INDEX idx_status_views_status_id ON public.status_views(status_id);
```

---

## 4. Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE public.status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_views ENABLE ROW LEVEL SECURITY;

-- Status Updates Policies
CREATE POLICY "Allow insert own status" ON public.status_updates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow update own status" ON public.status_updates
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow delete own status" ON public.status_updates
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Allow select public or own status" ON public.status_updates
  FOR SELECT USING (is_public OR auth.uid() = user_id);

-- Status Media Policies
CREATE POLICY "Allow insert media for own status" ON public.status_media
  FOR INSERT USING (EXISTS (SELECT 1 FROM public.status_updates su WHERE su.id = status_id AND su.user_id = auth.uid()));
CREATE POLICY "Allow select media for public or own status" ON public.status_media
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.status_updates su WHERE su.id = status_id AND (su.is_public OR su.user_id = auth.uid())));

-- Status Reactions Policies
CREATE POLICY "Allow insert reaction if can view status" ON public.status_reactions
  FOR INSERT USING (EXISTS (SELECT 1 FROM public.status_updates su WHERE su.id = status_id AND (su.is_public OR su.user_id = auth.uid())));
CREATE POLICY "Allow select reactions if can view status" ON public.status_reactions
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.status_updates su WHERE su.id = status_id AND (su.is_public OR su.user_id = auth.uid())));
CREATE POLICY "Allow delete own reaction" ON public.status_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Status Views Policies
CREATE POLICY "Allow insert view if can view status" ON public.status_views
  FOR INSERT USING (EXISTS (SELECT 1 FROM public.status_updates su WHERE su.id = status_id AND (su.is_public OR su.user_id = auth.uid())));
CREATE POLICY "Allow select views if can view status" ON public.status_views
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.status_updates su WHERE su.id = status_id AND (su.is_public OR su.user_id = auth.uid())));
CREATE POLICY "Allow delete own view" ON public.status_views
  FOR DELETE USING (auth.uid() = viewer_id);
```

---

## 5. Functions & Triggers

```sql
-- Function: Auto-delete expired statuses
CREATE OR REPLACE FUNCTION public.delete_expired_statuses()
RETURNS void AS $$
BEGIN
  DELETE FROM public.status_updates WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Trigger: Schedule deletion of expired statuses (run daily)
-- (You must schedule this function using a job scheduler like pg_cron or Supabase Edge Functions)

-- Function: Prevent duplicate reactions
CREATE OR REPLACE FUNCTION public.prevent_duplicate_reactions()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.status_reactions
    WHERE status_id = NEW.status_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'User has already reacted to this status';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_duplicate_reactions
BEFORE INSERT ON public.status_reactions
FOR EACH ROW EXECUTE FUNCTION public.prevent_duplicate_reactions();

-- Function: Prevent duplicate views
CREATE OR REPLACE FUNCTION public.prevent_duplicate_views()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.status_views
    WHERE status_id = NEW.status_id AND viewer_id = NEW.viewer_id
  ) THEN
    RAISE EXCEPTION 'User has already viewed this status';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_duplicate_views
BEFORE INSERT ON public.status_views
FOR EACH ROW EXECUTE FUNCTION public.prevent_duplicate_views();
```

---

-- This will run every hour and delete all expired statuses
-- (Uncomment the following if pg_cron is available)
-- SELECT cron.schedule(
--   'delete_expired_statuses_hourly',
--   '0 * * * *',
--   $$CALL public.delete_expired_statuses();$$
-- );
