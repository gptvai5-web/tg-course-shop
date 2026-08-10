
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
