
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
