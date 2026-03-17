-- Migrate profiles and related tables to use TEXT for IDs (compatible with Firebase UIDs)

-- 1. Disable constraints temporarily
SET session_replication_role = 'replica';

-- 2. Modify id column in profiles (Drop references first if necessary)
-- Note: In Supabase/Postgres, we need to alter the type of the column.
-- Since they are UUIDs, we cast them to TEXT.

ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE public.user_roles ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.posts ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.recipes ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.comments ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.followers ALTER COLUMN follower_id TYPE TEXT USING follower_id::TEXT;
ALTER TABLE public.followers ALTER COLUMN following_id TYPE TEXT USING following_id::TEXT;
ALTER TABLE public.saved_recipes ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.messages ALTER COLUMN sender_id TYPE TEXT USING sender_id::TEXT;
ALTER TABLE public.messages ALTER COLUMN receiver_id TYPE TEXT USING receiver_id::TEXT;
ALTER TABLE public.notifications ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.notifications ALTER COLUMN actor_id TYPE TEXT USING actor_id::TEXT;
ALTER TABLE public.recipe_ai_generations ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.ai_conversations ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.ai_usage_log ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.user_subscriptions ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.stories ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.keels ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.comment_reactions ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- 3. Re-enable constraints
SET session_replication_role = 'origin';

-- 4. Remove foreign key to auth.users as it won't work with Firebase UIDs
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
