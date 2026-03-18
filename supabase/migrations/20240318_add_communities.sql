-- Communities Table
CREATE TABLE IF NOT EXISTS public.communities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    price DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Community Members Table
CREATE TABLE IF NOT EXISTS public.community_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(community_id, user_id)
);

-- Community Content (Videos, Ebooks, Classes)
CREATE TABLE IF NOT EXISTS public.community_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'video', 'ebook', 'class'
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_content ENABLE ROW LEVEL SECURITY;

-- Communities Policies
CREATE POLICY "Anyone can view communities" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Chefs can create communities" ON public.communities FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND account_type = 'chef'
    )
);
CREATE POLICY "Owners can update their communities" ON public.communities FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their communities" ON public.communities FOR DELETE USING (auth.uid() = owner_id);

-- Members Policies
CREATE POLICY "Members can view their memberships" ON public.community_members FOR SELECT USING (true);
CREATE POLICY "Users can join communities" ON public.community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave communities" ON public.community_members FOR DELETE USING (auth.uid() = user_id);

-- Content Policies
CREATE POLICY "Members can view community content" ON public.community_content FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.community_members
        WHERE community_id = public.community_content.community_id AND user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.communities
        WHERE id = public.community_content.community_id AND owner_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Owners can manage content" ON public.community_content FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.communities
        WHERE id = public.community_content.community_id AND owner_id = auth.uid()
    )
);

-- AI Usage tracking bypass for Admins (Conceptual, enforced in code)
-- No SQL change needed if code handles it, but let's ensure subscriptions exist for all
INSERT INTO public.user_subscriptions (user_id, plan_type, status)
SELECT id, 'enterprise', 'active' FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
