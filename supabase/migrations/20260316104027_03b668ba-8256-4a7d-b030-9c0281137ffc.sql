
-- Subscription plan enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'starter', 'pro', 'elite');

-- User subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON public.subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- AI usage log table (tracks per-month usage)
CREATE TABLE public.ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  month_year text NOT NULL, -- format: '2026-03'
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_year)
);

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai usage" ON public.ai_usage_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai usage" ON public.ai_usage_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai usage" ON public.ai_usage_log
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Function to get user plan
CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id uuid)
RETURNS subscription_plan
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT plan FROM public.subscriptions WHERE user_id = _user_id LIMIT 1),
    'free'::subscription_plan
  )
$$;

-- Function to get AI usage count for current month
CREATE OR REPLACE FUNCTION public.get_ai_usage_this_month(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT usage_count FROM public.ai_usage_log
     WHERE user_id = _user_id AND month_year = to_char(now(), 'YYYY-MM')
     LIMIT 1),
    0
  )
$$;

-- Function to increment AI usage
CREATE OR REPLACE FUNCTION public.increment_ai_usage(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month text := to_char(now(), 'YYYY-MM');
  new_count integer;
BEGIN
  INSERT INTO public.ai_usage_log (user_id, month_year, usage_count)
  VALUES (_user_id, current_month, 1)
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET usage_count = ai_usage_log.usage_count + 1;
  
  SELECT usage_count INTO new_count FROM public.ai_usage_log
  WHERE user_id = _user_id AND month_year = current_month;
  
  RETURN new_count;
END;
$$;

-- Auto-create free subscription for new users (update handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  INSERT INTO public.subscriptions (user_id, plan)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$;
