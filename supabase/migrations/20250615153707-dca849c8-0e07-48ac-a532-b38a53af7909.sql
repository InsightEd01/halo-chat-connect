
-- Drop conflicting triggers and trigger functions with CASCADE to handle dependencies
DROP TRIGGER IF EXISTS create_profile_for_user ON auth.users CASCADE;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_user CASCADE;

DROP TRIGGER IF EXISTS create_profile ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.create_profile CASCADE;

DROP TRIGGER IF EXISTS set_user_id_trigger ON public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.set_user_id CASCADE;

-- Remove any other potential conflicting functions
DROP FUNCTION IF EXISTS public.create_profile() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
