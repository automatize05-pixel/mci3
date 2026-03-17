-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'like', 'comment', 'follow', 'mention', 'message'
    entity_id UUID, -- post_id, comment_id, etc.
    content TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for performance
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read);

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    plan_type TEXT DEFAULT 'free', -- 'free', 'pro', 'enterprise'
    status TEXT DEFAULT 'active', -- 'active', 'canceled', 'past_due'
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- AI Usage tracking update (if not enough in ai_usage_log)
-- Assuming ai_usage_log is used for this purpose.

-- Function to handle notification on like
CREATE OR REPLACE FUNCTION public.handle_new_like()
RETURNS TRIGGER AS $$
DECLARE
    post_owner_id UUID;
BEGIN
    SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;
    
    IF post_owner_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
        VALUES (post_owner_id, NEW.user_id, 'like', NEW.post_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for likes
DROP TRIGGER IF EXISTS on_like_notification ON public.likes;
CREATE TRIGGER on_like_notification
    AFTER INSERT ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_like();

-- Function to handle notification on comment
CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS TRIGGER AS $$
DECLARE
    post_owner_id UUID;
BEGIN
    SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;
    
    IF post_owner_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, entity_id, content)
        VALUES (post_owner_id, NEW.user_id, 'comment', NEW.post_id, left(NEW.content, 50));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for comments
DROP TRIGGER IF EXISTS on_comment_notification ON public.comments;
CREATE TRIGGER on_comment_notification
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_comment();
