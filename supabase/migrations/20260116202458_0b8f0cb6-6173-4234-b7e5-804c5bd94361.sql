-- Drop the existing permissive SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view profiles in their org" ON public.profiles;

-- Create a restrictive policy: Users can ONLY view their own full profile
-- Other org members' profiles must be accessed via profiles_safe view
CREATE POLICY "Users can only view their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());