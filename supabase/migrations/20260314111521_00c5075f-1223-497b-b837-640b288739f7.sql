ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS enrolled_by TEXT DEFAULT 'self';