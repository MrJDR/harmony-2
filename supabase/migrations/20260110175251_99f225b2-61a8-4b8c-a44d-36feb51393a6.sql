-- Make org creation policy depend on auth.uid() rather than role binding
-- This avoids edge cases where PostgREST role switching doesn't match expected roles

DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;

CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO public
WITH CHECK (auth.uid() IS NOT NULL);