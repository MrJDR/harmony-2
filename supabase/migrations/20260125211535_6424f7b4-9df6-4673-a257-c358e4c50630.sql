-- Fix missing user_roles for users who accepted invites but didn't get roles created
-- This fixes the historical data issue

-- Insert missing user_roles from accepted invites
INSERT INTO public.user_roles (user_id, org_id, role)
SELECT 
  p.id as user_id,
  p.org_id,
  COALESCE(oi.role, 'member'::app_role) as role
FROM public.profiles p
LEFT JOIN public.org_invites oi ON oi.email = p.email AND oi.org_id = p.org_id AND oi.accepted_at IS NOT NULL
WHERE p.org_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = p.id AND ur.org_id = p.org_id
  );

-- Also update the handle_new_user trigger to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  invite_record RECORD;
BEGIN
  -- Check if user was invited to an org
  SELECT * INTO invite_record
  FROM public.org_invites
  WHERE email = NEW.email
    AND accepted_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF invite_record IS NOT NULL THEN
    -- User was invited - join that org
    INSERT INTO public.profiles (id, email, first_name, last_name, org_id)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'last_name',
      invite_record.org_id
    );

    -- Create user role with invited role - check if it doesn't already exist
    INSERT INTO public.user_roles (user_id, org_id, role)
    VALUES (NEW.id, invite_record.org_id, invite_record.role)
    ON CONFLICT (user_id, org_id) DO NOTHING;

    -- Mark invite as accepted
    UPDATE public.org_invites
    SET accepted_at = now()
    WHERE id = invite_record.id;
  ELSE
    -- New user without invite - create profile without org
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'last_name'
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Add unique constraint on user_roles if not exists (for ON CONFLICT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_org_id_key'
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_org_id_key UNIQUE (user_id, org_id);
  END IF;
END $$;