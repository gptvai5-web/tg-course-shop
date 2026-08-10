
-- Comments table for video discussions
CREATE TABLE public.video_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.chapter_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL DEFAULT '',
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

-- Anyone enrolled can read comments (we'll check enrollment in app)
CREATE POLICY "Authenticated users can read comments"
  ON public.video_comments FOR SELECT TO authenticated
  USING (true);

-- Users can insert their own comments
CREATE POLICY "Users can insert own comments"
  ON public.video_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON public.video_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Admins can delete any comment
CREATE POLICY "Admins can delete any comment"
  ON public.video_comments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
