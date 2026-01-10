-- Fix user_roles: Allow users to insert their own owner role when they don't have an org yet
-- This handles the chicken-and-egg problem during org creation

-- First, create a function to check if user has no org yet
CREATE OR REPLACE FUNCTION public.user_has_no_org(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = user_id AND org_id IS NOT NULL
  )
$$;

-- Add policy for users to insert their own owner role during org creation
CREATE POLICY "Users can create their own owner role during org setup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND role = 'owner'
  AND public.user_has_no_org(auth.uid())
);

-- Also need to allow the creator to view their new role immediately
-- Update: Allow users to view their own roles regardless of org match
DROP POLICY IF EXISTS "Users can view roles in their org" ON public.user_roles;
CREATE POLICY "Users can view roles in their org or own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR org_id = get_user_org_id(auth.uid())
);