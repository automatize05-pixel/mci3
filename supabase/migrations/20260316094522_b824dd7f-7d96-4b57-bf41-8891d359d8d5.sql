
-- 1. Account type enum and column
CREATE TYPE public.account_type AS ENUM ('user', 'chef');
ALTER TABLE public.profiles ADD COLUMN account_type public.account_type NOT NULL DEFAULT 'user';

-- 2. Parent comment for nested replies
ALTER TABLE public.comments ADD COLUMN parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;

-- 3. Likes table (proper toggle instead of counter)
CREATE TABLE public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes" ON public.likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can like posts" ON public.likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Allow users to update own comments (for editing)
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 5. Update handle_new_user to include account_type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, username, email, account_status, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    NEW.email,
    'pending',
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'user')::account_type
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$function$;
