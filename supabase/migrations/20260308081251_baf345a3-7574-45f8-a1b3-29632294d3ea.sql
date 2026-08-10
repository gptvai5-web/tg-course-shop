
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  device_info TEXT NOT NULL DEFAULT 'Unknown Device',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id)
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions" ON public.user_sessions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Authenticated users can insert their own sessions
CREATE POLICY "Users can insert own sessions" ON public.user_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON public.user_sessions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
