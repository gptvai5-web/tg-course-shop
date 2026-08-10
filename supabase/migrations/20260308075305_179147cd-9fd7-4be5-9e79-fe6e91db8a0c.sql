-- Create instructors table
CREATE TABLE public.instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text NOT NULL DEFAULT 'Instructor',
  avatar_url text DEFAULT NULL,
  bio text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active instructors" ON public.instructors
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage instructors" ON public.instructors
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed sample instructors from existing course data
INSERT INTO public.instructors (name, title, bio, display_order) VALUES
  ('Dr. Rahman', 'Physics Instructor', 'Expert in SSC & HSC Physics with 10+ years of teaching experience.', 1),
  ('Prof. Karim', 'Chemistry Instructor', 'Passionate chemistry educator specializing in SSC preparation.', 2),
  ('Nadia Akter', 'Mathematics Instructor', 'Award-winning math teacher with innovative teaching methods.', 3),
  ('Dr. Hasan', 'Physics Instructor', 'HSC Physics specialist with research background.', 4),
  ('Prof. Islam', 'Mathematics Instructor', 'Higher mathematics expert for HSC students.', 5),
  ('Sarah Ahmed', 'English Instructor', 'IELTS certified English trainer and speaking coach.', 6),
  ('Tanvir Hossain', 'Web Development Instructor', 'Full-stack developer and tech educator.', 7),
  ('Rafiq Uddin', 'ICT Instructor', 'HSC ICT preparation specialist.', 8);