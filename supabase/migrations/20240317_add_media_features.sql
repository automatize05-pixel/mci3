-- Stories Table (24h expiry)
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'image', -- 'image' or 'video'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for stories (to quickly filter by time)
CREATE INDEX IF NOT EXISTS stories_created_at_idx ON public.stories(created_at);

-- Keels Table (Short vertical videos)
CREATE TABLE IF NOT EXISTS public.keels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    title TEXT,
    description TEXT,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comment Reactions Table
CREATE TABLE IF NOT EXISTS public.comment_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT NOT NULL DEFAULT 'like', -- 'like', 'heart', 'laugh', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(comment_id, user_id, reaction_type)
);

-- RLS Policies
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

-- Stories: Anyone can view, only owner can create/delete
CREATE POLICY "Stories are viewable by everyone" ON public.stories FOR SELECT USING (true);
CREATE POLICY "Users can create stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own stories" ON public.stories FOR DELETE USING (auth.uid() = user_id);

-- Keels: Anyone can view, only owner can create/delete
CREATE POLICY "Keels are viewable by everyone" ON public.keels FOR SELECT USING (true);
CREATE POLICY "Users can create keels" ON public.keels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own keels" ON public.keels FOR DELETE USING (auth.uid() = user_id);

-- Comment Reactions Table (Already defined above, adding helper function)

-- Helper function to get reaction counts for multiple comments
CREATE OR REPLACE FUNCTION public.get_comment_reaction_counts(comment_ids UUID[])
RETURNS TABLE(comment_id UUID, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT cr.comment_id, COUNT(*) as count
    FROM public.comment_reactions cr
    WHERE cr.comment_id = ANY(comment_ids)
    GROUP BY cr.comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
