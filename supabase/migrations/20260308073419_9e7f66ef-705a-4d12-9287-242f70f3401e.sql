
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
