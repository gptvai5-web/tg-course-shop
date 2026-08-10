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
