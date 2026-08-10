-- Create categories table managed by admin
CREATE TABLE public.course_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories" ON public.course_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON public.course_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add students_count to courses
ALTER TABLE public.courses ADD COLUMN students_count integer NOT NULL DEFAULT 0;

-- Update category column to reference category names
INSERT INTO public.course_categories (name, display_order) VALUES
  ('SSC', 1), ('HSC', 2), ('Skills', 3);

-- Update sample courses with student counts
UPDATE public.courses SET students_count = floor(random() * 3000 + 500);