-- Ensure the admin user has the admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM public.profiles
WHERE email = 'ageusilva905@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Ensure all users can see who is an admin (for the verified badge)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view user roles" ON public.user_roles;
CREATE POLICY "Anyone can view user roles" ON public.user_roles 
    FOR SELECT TO public USING (true);

-- Ensure admins can manage roles if needed (security best practice)
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
CREATE POLICY "Admins can manage user roles" ON public.user_roles 
    FOR ALL TO authenticated USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()::TEXT AND role = 'admin')
    );
