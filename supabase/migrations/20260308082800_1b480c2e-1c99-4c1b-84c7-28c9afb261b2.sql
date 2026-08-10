
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
