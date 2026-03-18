-- 1. Modify Profiles for Gamification and Plan Type
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'padrao';

-- 2. Create Shopping Lists Table
CREATE TABLE IF NOT EXISTS public.shopping_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    items JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id) -- One active list per user
);

ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own shopping list"
    ON public.shopping_lists
    FOR ALL
    USING (auth.uid() = user_id);

-- 3. Create Meal Plans Table
CREATE TABLE IF NOT EXISTS public.meal_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    meal_date DATE NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('pequeno-almoço', 'almoço', 'jantar', 'lanche')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own meal plans"
    ON public.meal_plans
    FOR ALL
    USING (auth.uid() = user_id);

-- 4. Create Masterclasses Table
CREATE TABLE IF NOT EXISTS public.masterclasses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chef_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    price NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.masterclasses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view masterclasses"
    ON public.masterclasses
    FOR SELECT
    USING (true);

CREATE POLICY "Chefs can create and manage their masterclasses"
    ON public.masterclasses
    FOR ALL
    USING (auth.uid() = chef_id);

-- 5. Create User Badges Table
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, badge_type)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user badges"
    ON public.user_badges
    FOR SELECT
    USING (true);

CREATE POLICY "System can award badges to users"
    ON public.user_badges
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Expose functions to check limits early on Postgres (optional, but handled in app for UI)

-- Notify realtime channels
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_lists;
ALTER PUBLICATION supabase_realtime ADD TABLE meal_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE masterclasses;
ALTER PUBLICATION supabase_realtime ADD TABLE user_badges;
