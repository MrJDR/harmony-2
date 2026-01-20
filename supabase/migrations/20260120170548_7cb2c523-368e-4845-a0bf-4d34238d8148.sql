-- Fix security issues: Add explicit authentication checks to prevent anonymous access

-- 1. Fix profiles table: Add policy to deny anonymous access
-- The current policy only checks (id = auth.uid()) which returns false for anon but doesn't block
CREATE POLICY "Deny anonymous access to profiles"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (false);

-- 2. Fix contacts table: Update SELECT policy to require authentication
-- Drop existing policy and recreate with explicit auth check
DROP POLICY IF EXISTS "Users can view contacts in their org" ON public.contacts;

CREATE POLICY "Authenticated users can view contacts in their org"
  ON public.contacts
  FOR SELECT
  TO authenticated
  USING (org_id = get_user_org_id(auth.uid()));

-- Also add explicit deny for anon role
CREATE POLICY "Deny anonymous access to contacts"
  ON public.contacts
  FOR SELECT
  TO anon
  USING (false);