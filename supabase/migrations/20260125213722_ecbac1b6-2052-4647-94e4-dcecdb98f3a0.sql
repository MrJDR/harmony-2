
-- Fix RLS on profiles to allow org members to see each other
-- The profiles_safe view already handles email privacy correctly

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Users can only view their own profile" ON public.profiles;

-- Create a new policy that allows users to see:
-- 1. Their own profile
-- 2. Profiles of users in the same organization
CREATE POLICY "Users can view profiles in their org"
ON public.profiles
FOR SELECT
USING (
  id = auth.uid() 
  OR org_id = get_user_org_id(auth.uid())
);
