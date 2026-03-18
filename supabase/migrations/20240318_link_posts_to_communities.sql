-- Add community_id to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE;

-- Update RLS for posts to allow community members to see community posts
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
CREATE POLICY "Anyone can view public posts or members can view community posts" ON public.posts
FOR SELECT USING (
    community_id IS NULL OR 
    EXISTS (
        SELECT 1 FROM public.community_members 
        WHERE community_id = public.posts.community_id AND user_id = auth.uid()
    ) OR 
    EXISTS (
        SELECT 1 FROM public.communities 
        WHERE id = public.posts.community_id AND owner_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);
