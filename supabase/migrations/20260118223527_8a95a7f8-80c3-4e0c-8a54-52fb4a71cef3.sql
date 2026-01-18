-- Fix org_invites RLS policies: avoid querying auth.users (permission denied)

DO $$
BEGIN
  -- Drop policies that reference auth.users
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='org_invites' AND policyname='Users can accept their own invites'
  ) THEN
    EXECUTE 'DROP POLICY "Users can accept their own invites" ON public.org_invites';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='org_invites' AND policyname='Users can view their own invites by email'
  ) THEN
    EXECUTE 'DROP POLICY "Users can view their own invites by email" ON public.org_invites';
  END IF;
END $$;

-- Re-create policies using the email claim from the JWT.
-- This avoids selecting from auth.users (which is not allowed from RLS).

CREATE POLICY "Users can view their own invites by email"
ON public.org_invites
FOR SELECT
USING (
  lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);

CREATE POLICY "Users can accept their own invites"
ON public.org_invites
FOR UPDATE
USING (
  lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
)
WITH CHECK (
  lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);
