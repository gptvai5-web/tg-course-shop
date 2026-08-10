
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
