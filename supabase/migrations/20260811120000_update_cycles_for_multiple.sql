-- Allow chapters to exist directly under a cycle without a subject
ALTER TABLE public.chapters ALTER COLUMN subject_id DROP NOT NULL;

-- Allow multiple cycle IDs in payments table for bulk purchase
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS cycle_ids UUID[] DEFAULT '{}';
