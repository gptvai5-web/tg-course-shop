
-- Add offer timer fields to combo_courses
ALTER TABLE public.combo_courses 
  ADD COLUMN IF NOT EXISTS offer_end_date timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS offer_label text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS instructor_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS duration text DEFAULT '',
  ADD COLUMN IF NOT EXISTS lessons_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level text DEFAULT '',
  ADD COLUMN IF NOT EXISTS slug text DEFAULT NULL;

-- Create combo_enrollments table to track combo purchases
CREATE TABLE IF NOT EXISTS public.combo_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  combo_id uuid NOT NULL REFERENCES public.combo_courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, combo_id)
);

ALTER TABLE public.combo_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own combo enrollments" ON public.combo_enrollments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage combo enrollments" ON public.combo_enrollments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Add combo_id to payments table for combo purchases
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS combo_id uuid REFERENCES public.combo_courses(id) DEFAULT NULL;

-- Allow realtime for combo_enrollments
ALTER PUBLICATION supabase_realtime ADD TABLE public.combo_enrollments;
