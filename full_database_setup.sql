

-- MIGRATION: 20260308070743_13bd0c3d-0699-48f7-991d-cafbe521ac1d.sql

-- Create timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: users can read their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Admins can manage roles
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Function to get all roles for a user
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(role), ARRAY[]::app_role[]) FROM public.user_roles WHERE user_id = _user_id
$$;

-- Trigger to auto-create profile and assign student role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- MIGRATION: 20260308073419_9e7f66ef-705a-4d12-9287-242f70f3401e.sql

-- Featured courses for carousel (admin-managed)
CREATE TABLE public.featured_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT DEFAULT '#',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.featured_courses ENABLE ROW LEVEL SECURITY;

-- Anyone can read active featured courses
CREATE POLICY "Anyone can view active featured courses"
ON public.featured_courses FOR SELECT
USING (is_active = true);

-- Admins can manage featured courses
CREATE POLICY "Admins can manage featured courses"
ON public.featured_courses FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Student reviews
CREATE TABLE public.student_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  review_text TEXT NOT NULL,
  rating NUMERIC(2,1) NOT NULL DEFAULT 5.0,
  avatar_url TEXT,
  course_name TEXT DEFAULT 'Student',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.student_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read visible reviews
CREATE POLICY "Anyone can view visible reviews"
ON public.student_reviews FOR SELECT
USING (is_visible = true);

-- Admins can manage reviews
CREATE POLICY "Admins can manage reviews"
ON public.student_reviews FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Learning path categories
CREATE TABLE public.learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'BookOpen',
  color TEXT NOT NULL DEFAULT 'from-blue-100 to-blue-200',
  icon_color TEXT NOT NULL DEFAULT 'bg-blue-500',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active learning paths"
ON public.learning_paths FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage learning paths"
ON public.learning_paths FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default learning paths
INSERT INTO public.learning_paths (title, description, icon_name, color, icon_color, display_order) VALUES
('Academic Courses', 'Comprehensive academic preparation for all levels', 'GraduationCap', 'from-blue-50 to-cyan-50', 'bg-blue-500', 1),
('Admission Courses', 'Specialized courses for university admissions', 'BookOpen', 'from-green-50 to-emerald-50', 'bg-green-500', 2),
('Mathematics', 'Advanced math concepts and problem solving', 'Calculator', 'from-purple-50 to-violet-50', 'bg-purple-500', 3),
('Science & Physics', 'Comprehensive science and physics courses', 'FlaskConical', 'from-orange-50 to-amber-50', 'bg-orange-500', 4),
('Technology', 'Modern technology and programming courses', 'Code', 'from-indigo-50 to-blue-50', 'bg-indigo-500', 5),
('Community', 'Join our supportive learning community', 'Users', 'from-pink-50 to-rose-50', 'bg-pink-500', 6);

-- Insert sample reviews
INSERT INTO public.student_reviews (student_name, review_text, rating, course_name) VALUES
('Tasannun Tarin', 'This platform is amazing! The teaching methods are so effective. I improved my scores significantly.', 5.0, 'Student'),
('Mubina Khanom', 'The instructors are incredibly helpful. I feel so much more confident in my studies now.', 5.0, 'Student'),
('Shamim Shohan', 'To be honest, this series is too much effective. Before I was weak in MCQ of Math. Right now I get 27-29 out of 30. Thank you!', 5.0, 'Student'),
('Afrina Jahan', 'Very helpful! All the basics are covered perfectly. This is one of the best platforms forever. Thanks a lot!', 5.0, 'Student'),
('Borhan Uddin Shifat', 'I started studying just 2 months before my exam and got excellent results thanks to these courses.', 5.0, 'Student'),
('Sumaiya Sumu', 'Physics and Chemistry basic to Pro course is excellent. The way they teach makes complex topics easy to understand.', 5.0, 'Student');


-- MIGRATION: 20260308074205_cb33c157-1fdb-4d22-81f9-af59e646e929.sql
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

-- MIGRATION: 20260308074440_023256a5-5225-46bd-9554-70fe78eca9d7.sql
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

-- MIGRATION: 20260308075305_179147cd-9fd7-4be5-9e79-fe6e91db8a0c.sql
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

-- MIGRATION: 20260308080158_90aa11bd-6d04-46cf-ad36-37a43263b99a.sql

CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(code, course_id)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Public can read active coupons (needed to validate codes)
CREATE POLICY "Anyone can read active coupons" ON public.coupons
  FOR SELECT USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));


-- MIGRATION: 20260308081251_baf345a3-7574-45f8-a1b3-29632294d3ea.sql

CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  device_info TEXT NOT NULL DEFAULT 'Unknown Device',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id)
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions" ON public.user_sessions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Authenticated users can insert their own sessions
CREATE POLICY "Users can insert own sessions" ON public.user_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON public.user_sessions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- MIGRATION: 20260308082800_1b480c2e-1c99-4c1b-84c7-28c9afb261b2.sql

CREATE TABLE public.course_contents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  content_url TEXT,
  content_text TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.course_contents ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active contents (students view only)
CREATE POLICY "Enrolled students can view course contents"
ON public.course_contents
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE enrollments.course_id = course_contents.course_id
    AND enrollments.user_id = auth.uid()
  )
);

-- Admins can do everything
CREATE POLICY "Admins can manage course contents"
ON public.course_contents
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Teachers can manage course contents
CREATE POLICY "Teachers can manage course contents"
ON public.course_contents
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'teacher'))
WITH CHECK (public.has_role(auth.uid(), 'teacher'));


-- MIGRATION: 20260308083925_3f81db78-76cc-41f3-913b-bc2fb6740e9b.sql

-- Subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chapters table
CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8B5CF6',
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chapter videos table
CREATE TABLE public.chapter_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_videos ENABLE ROW LEVEL SECURITY;

-- Public read policies (enrolled students can view)
CREATE POLICY "Anyone can view active subjects" ON public.subjects FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active chapters" ON public.chapters FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active videos" ON public.chapter_videos FOR SELECT USING (is_active = true);

-- Admin full access policies
CREATE POLICY "Admins can manage subjects" ON public.subjects FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage chapters" ON public.chapters FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage videos" ON public.chapter_videos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));


-- MIGRATION: 20260308085334_4ac77abd-3786-47e4-a908-ba0dd0891c6a.sql

-- Contact messages table
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public contact form)
CREATE POLICY "Anyone can submit contact message"
  ON public.contact_messages FOR INSERT
  WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can read contact messages"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update (mark as read)
CREATE POLICY "Admins can update contact messages"
  ON public.contact_messages FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete contact messages"
  ON public.contact_messages FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


-- MIGRATION: 20260308091301_bc16152a-f6c8-497e-89f9-3ade20a0377b.sql

-- Combo courses table
CREATE TABLE public.combo_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC,
  image_url TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Junction table linking combos to courses
CREATE TABLE public.combo_course_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  combo_id UUID NOT NULL REFERENCES public.combo_courses(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(combo_id, course_id)
);

-- RLS
ALTER TABLE public.combo_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_course_items ENABLE ROW LEVEL SECURITY;

-- Public read for active combos
CREATE POLICY "Anyone can view active combos" ON public.combo_courses
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage combos" ON public.combo_courses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view combo items" ON public.combo_course_items
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage combo items" ON public.combo_course_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));


-- MIGRATION: 20260308093614_a1db6340-8512-4850-89a3-a927506a958f.sql

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  status TEXT NOT NULL DEFAULT 'pending',
  trx_id TEXT,
  payment_method TEXT,
  coupon_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage payments" ON public.payments
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can insert own payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());


-- MIGRATION: 20260308135626_5e92b58e-2c88-4b3a-bfda-8b748227dad9.sql
ALTER TABLE public.chapter_videos ADD COLUMN embed_code TEXT DEFAULT NULL;

-- MIGRATION: 20260308140234_971ac629-76d4-4df8-8c9f-ee24b8e8c942.sql

CREATE TABLE public.course_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL DEFAULT 'announcement',
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  url TEXT DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.course_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active course updates"
  ON public.course_updates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Teachers and admins can manage course updates"
  ON public.course_updates FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin')
  );


-- MIGRATION: 20260308144111_7edcacb4-bf1b-4d67-9d44-53aa72786d2e.sql

-- Chapter materials (Lecture Sheet, Note, Practice Sheet, Solve Sheet)
CREATE TABLE public.chapter_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  material_type TEXT NOT NULL DEFAULT 'lecture_sheet',
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chapter_materials ENABLE ROW LEVEL SECURITY;

-- Students can view materials for chapters they have access to
CREATE POLICY "Authenticated users can view active materials"
  ON public.chapter_materials FOR SELECT TO authenticated
  USING (is_active = true);

-- Teachers/admins can manage materials
CREATE POLICY "Teachers can manage materials"
  ON public.chapter_materials FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- Course offer timer fields
ALTER TABLE public.courses 
  ADD COLUMN IF NOT EXISTS offer_end_date TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS offer_label TEXT DEFAULT 'Discount Offer Ends In:';


-- MIGRATION: 20260308154642_3746144d-b6f5-414c-9237-d7d51adf7c59.sql

-- Fix: Teachers need to manage subjects, chapters, videos, and courses (for offer timer)
-- Add teacher policies for subjects
CREATE POLICY "Teachers can manage subjects"
ON public.subjects FOR ALL TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

-- Add teacher policies for chapters
CREATE POLICY "Teachers can manage chapters"
ON public.chapters FOR ALL TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

-- Add teacher policies for chapter_videos
CREATE POLICY "Teachers can manage videos"
ON public.chapter_videos FOR ALL TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

-- Teachers need to update courses (for offer timer)
CREATE POLICY "Teachers can manage courses"
ON public.courses FOR ALL TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

-- Fix: Admin dashboard needs to read all enrollments for stats
CREATE POLICY "Admins can view all enrollments"
ON public.enrollments FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

-- Fix: Admin dashboard needs to count user_roles for stats  
CREATE POLICY "Admins can view all user roles"
ON public.user_roles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix: Admin/teacher need to manage enrollments (manual enroll, etc.)
CREATE POLICY "Admins can manage enrollments"
ON public.enrollments FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

-- Fix: Teachers need to manage coupons
CREATE POLICY "Teachers can manage coupons"
ON public.coupons FOR ALL TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

-- Fix: Teachers need to manage featured courses
CREATE POLICY "Teachers can manage featured courses"
ON public.featured_courses FOR ALL TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

-- Fix: Teachers need to manage categories
CREATE POLICY "Teachers can manage categories"
ON public.course_categories FOR ALL TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

-- Fix: Teachers need to manage student reviews
CREATE POLICY "Teachers can manage reviews"
ON public.student_reviews FOR ALL TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));


-- MIGRATION: 20260308154734_205e2dce-0c11-4d7e-8c06-72cd56509e06.sql

-- Teachers also need to view all user_roles (to see teacher list, student counts, etc.)
CREATE POLICY "Teachers can view all user roles"
ON public.user_roles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role));


-- MIGRATION: 20260308181640_690fe82e-2cab-468a-8d33-e1ec9d692e61.sql

-- Comments table for video discussions
CREATE TABLE public.video_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.chapter_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL DEFAULT '',
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

-- Anyone enrolled can read comments (we'll check enrollment in app)
CREATE POLICY "Authenticated users can read comments"
  ON public.video_comments FOR SELECT TO authenticated
  USING (true);

-- Users can insert their own comments
CREATE POLICY "Users can insert own comments"
  ON public.video_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON public.video_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Admins can delete any comment
CREATE POLICY "Admins can delete any comment"
  ON public.video_comments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


-- MIGRATION: 20260308182201_73339da4-fd82-48ec-ba1a-ff424e867f40.sql

CREATE TABLE public.comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.video_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read reactions"
ON public.comment_reactions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can insert own reactions"
ON public.comment_reactions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reactions"
ON public.comment_reactions FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions"
ON public.comment_reactions FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_comment_reactions_comment_id ON public.comment_reactions(comment_id);
CREATE INDEX idx_comment_reactions_user_id ON public.comment_reactions(user_id);


-- MIGRATION: 20260314111316_3f8150ff-babf-42e7-99fb-c73cae1ef644.sql
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS ip_address TEXT DEFAULT '';

-- MIGRATION: 20260314111521_00c5075f-1223-497b-b837-640b288739f7.sql
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS enrolled_by TEXT DEFAULT 'self';

-- MIGRATION: 20260322052116_bcf19c77-e07c-4217-8aaa-f732aed6691c.sql

-- course_levels table
CREATE TABLE IF NOT EXISTS public.course_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.course_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read course levels" ON public.course_levels FOR SELECT USING (true);

CREATE POLICY "Admins can manage course levels" ON public.course_levels
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.course_levels (name, display_order) VALUES
  ('Beginner', 0), ('Intermediate', 1), ('Advanced', 2);

-- telegram field on contact_messages
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS telegram text;

-- slug field on courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- function to lookup user by email securely
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email_input text)
RETURNS TABLE(user_id uuid, user_email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id as user_id, email::text as user_email FROM auth.users WHERE lower(email) = lower(email_input) LIMIT 1;
$$;


-- MIGRATION: 20260322060304_bd1d1863-9d48-4bb1-b70a-f8792fe6c618.sql

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


-- MIGRATION: 20260322062750_86859313-6020-45c7-b6c2-8aa3df45d3bb.sql

-- 1. Create a public stats function (SECURITY DEFINER) so anonymous users can see counts
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_enrollments', (SELECT count(*) FROM enrollments WHERE status = 'active'),
    'total_courses', (SELECT count(*) FROM courses WHERE is_active = true),
    'total_instructors', (SELECT count(*) FROM instructors WHERE is_active = true),
    'total_lessons', (SELECT COALESCE(sum(lessons_count), 0) FROM courses WHERE is_active = true),
    'course_student_counts', (
      SELECT json_object_agg(course_id, cnt)
      FROM (SELECT course_id, count(*) as cnt FROM enrollments WHERE status = 'active' GROUP BY course_id) sub
    )
  );
$$;

-- 2. Make coupons.course_id nullable for universal coupons
ALTER TABLE public.coupons ALTER COLUMN course_id DROP NOT NULL;

-- 3. Add combo_id to coupons for combo-specific coupons
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS combo_id uuid REFERENCES public.combo_courses(id) ON DELETE CASCADE;

-- 4. Add is_universal flag for universal coupons
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_universal boolean DEFAULT false;


-- MIGRATION: 20260802111353_5ddb8ba8-3a7e-4b6f-8eca-f5920027b9ce.sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_key ON public.profiles(user_id);

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.user_id AND p.email IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url, email, last_login_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    NEW.email,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
      avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), public.profiles.avatar_url),
      email = COALESCE(EXCLUDED.email, public.profiles.email),
      last_login_at = now(),
      updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
    INSERT INTO public.profiles (user_id, full_name, avatar_url, email, last_login_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
      NEW.email,
      now()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
        avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), public.profiles.avatar_url),
        email = COALESCE(EXCLUDED.email, public.profiles.email),
        last_login_at = now(),
        updated_at = now();
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
AFTER UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_user_login();

-- MIGRATION: 20260802115822_ce880eea-eba1-4712-b870-ef97fb887267.sql
-- 1) profiles: stop exposing every user's data to all signed-in users
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins and teachers can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'teacher'::app_role)
);

-- 2) chapter_materials: scope viewing to enrollment in the parent course
DROP POLICY IF EXISTS "Authenticated users can view active materials" ON public.chapter_materials;

CREATE POLICY "Enrolled students can view materials"
ON public.chapter_materials
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND EXISTS (
    SELECT 1
    FROM public.chapters c
    JOIN public.subjects s ON s.id = c.subject_id
    JOIN public.enrollments e ON e.course_id = s.course_id
    WHERE c.id = chapter_materials.chapter_id
      AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Admins and teachers can view materials"
ON public.chapter_materials
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'teacher'::app_role)
);


-- MIGRATION: Grant Admin and Teacher Roles
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'ashraful.islam.bogura83@gmail.com';

  IF target_user_id IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = target_user_id;
    INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'admin');
    INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'teacher');
  END IF;
END $$;
