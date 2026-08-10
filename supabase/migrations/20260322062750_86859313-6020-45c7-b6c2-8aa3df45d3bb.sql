
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
