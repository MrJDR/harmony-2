-- Drop the overly permissive INSERT policy on organizations table
-- Organizations should only be created via the secure create_organization_and_assign_owner function
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;