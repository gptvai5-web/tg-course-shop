-- Create courses table
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  instructor_name text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  original_price numeric DEFAULT NULL,
  duration text NOT NULL DEFAULT '',
  lessons_count integer NOT NULL DEFAULT 0,
  level text NOT NULL DEFAULT 'Beginner',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create enrollments table
CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Courses: anyone can read active courses
CREATE POLICY "Anyone can view active courses" ON public.courses
  FOR SELECT USING (is_active = true);

-- Courses: admins can manage
CREATE POLICY "Admins can manage courses" ON public.courses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Enrollments: users can view their own
CREATE POLICY "Users can view own enrollments" ON public.enrollments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Enrollments: users can enroll themselves
CREATE POLICY "Users can enroll" ON public.enrollments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());