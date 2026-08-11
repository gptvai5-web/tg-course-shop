-- Add has_cycles to courses
ALTER TABLE public.courses ADD COLUMN has_cycles BOOLEAN NOT NULL DEFAULT false;

-- Create cycles table
CREATE TABLE public.cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC DEFAULT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active cycles" ON public.cycles FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage cycles" ON public.cycles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add cycle_id to chapters
ALTER TABLE public.chapters ADD COLUMN cycle_id UUID REFERENCES public.cycles(id) ON DELETE SET NULL;

-- Create cycle_enrollments table
CREATE TABLE public.cycle_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, cycle_id)
);

ALTER TABLE public.cycle_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own cycle enrollments" ON public.cycle_enrollments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage cycle enrollments" ON public.cycle_enrollments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Add cycle_id to payments
ALTER TABLE public.payments ADD COLUMN cycle_id UUID REFERENCES public.cycles(id) ON DELETE SET NULL;
