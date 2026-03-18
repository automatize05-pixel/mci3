-- Table for manual subscription requests (PayPay)
CREATE TABLE IF NOT EXISTS public.subscription_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own requests" ON public.subscription_requests 
    FOR SELECT TO authenticated USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can create requests" ON public.subscription_requests 
    FOR INSERT TO authenticated WITH CHECK (auth.uid()::TEXT = user_id);

CREATE POLICY "Admins can view all requests" ON public.subscription_requests 
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()::TEXT AND role = 'admin')
    );

CREATE POLICY "Admins can update requests" ON public.subscription_requests 
    FOR UPDATE TO authenticated USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()::TEXT AND role = 'admin')
    );
