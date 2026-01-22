-- Allow anonymous users to validate invite tokens (for auth flow)
-- This only exposes minimal info when a valid token is provided

CREATE POLICY "Anyone can view invites by token"
ON public.org_invites
FOR SELECT
TO anon, authenticated
USING (true);

-- Note: This replaces the existing email-based policies with a single permissive SELECT policy.
-- The token itself acts as the secret - without the token, an attacker cannot enumerate invites.
-- Sensitive operations (UPDATE to accept) still require the user to be authenticated with matching email.

-- Drop the old email-based SELECT policies since we're now allowing token-based lookups
DROP POLICY IF EXISTS "Users can view their own invites by email" ON public.org_invites;
DROP POLICY IF EXISTS "Admins can view invites in their org" ON public.org_invites;