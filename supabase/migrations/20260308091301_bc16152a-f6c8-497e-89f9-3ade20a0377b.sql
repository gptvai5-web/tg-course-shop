
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
