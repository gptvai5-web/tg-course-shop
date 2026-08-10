
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
