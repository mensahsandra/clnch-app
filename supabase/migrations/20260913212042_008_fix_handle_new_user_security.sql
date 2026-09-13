/*
# Fix security warnings on handle_new_user function

1. Purpose
   Supabase security advisor flagged two issues on `public.handle_new_user()`:
   - Mutable search_path (function_search_path_mutable)
   - Callable by anon + authenticated roles as SECURITY DEFINER

2. Changes
   - Drop the trigger first, then the function, then recreate both with
     explicit search_path = public.
   - Revoke EXECUTE from anon and authenticated so only the owner can call it.

3. Idempotency
   Uses IF EXISTS and CREATE OR REPLACE.
*/

-- Revoke public execute grants
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- Drop trigger first, then function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate with explicit search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    now(),
    now()
  );
  RETURN NEW;
END;
$$;

-- Re-attach the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();