
-- Teachers also need to view all user_roles (to see teacher list, student counts, etc.)
CREATE POLICY "Teachers can view all user roles"
ON public.user_roles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role));
