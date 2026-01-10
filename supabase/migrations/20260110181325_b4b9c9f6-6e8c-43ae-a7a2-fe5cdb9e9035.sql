-- Add archived columns to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS archived_by uuid DEFAULT NULL;

-- Create function to handle owner leaving and succession
CREATE OR REPLACE FUNCTION public.handle_owner_leaving(_user_id uuid, _org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  owner_count int;
  next_admin uuid;
BEGIN
  -- Check if user is an owner
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND org_id = _org_id AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'user_not_owner';
  END IF;

  -- Count remaining owners after this one leaves
  SELECT COUNT(*) INTO owner_count
  FROM public.user_roles
  WHERE org_id = _org_id AND role = 'owner' AND user_id != _user_id;

  -- If this is the last owner, promote the longest-tenured admin
  IF owner_count = 0 THEN
    SELECT ur.user_id INTO next_admin
    FROM public.user_roles ur
    WHERE ur.org_id = _org_id AND ur.role = 'admin' AND ur.user_id != _user_id
    ORDER BY ur.created_at ASC
    LIMIT 1;

    IF next_admin IS NOT NULL THEN
      -- Promote admin to owner
      UPDATE public.user_roles
      SET role = 'owner'
      WHERE user_id = next_admin AND org_id = _org_id;
    END IF;
  END IF;

  -- Remove user from org
  DELETE FROM public.user_roles WHERE user_id = _user_id AND org_id = _org_id;
  UPDATE public.profiles SET org_id = NULL WHERE id = _user_id;
END;
$$;

-- Create function to archive an organization (owner only)
CREATE OR REPLACE FUNCTION public.archive_organization(_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is an owner of this org
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND org_id = _org_id AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'not_owner';
  END IF;

  -- Archive the organization (soft delete)
  UPDATE public.organizations
  SET archived_at = now(), archived_by = auth.uid()
  WHERE id = _org_id;

  -- Remove all users from the org (but keep their profiles)
  UPDATE public.profiles
  SET org_id = NULL
  WHERE org_id = _org_id;

  -- Delete all user roles for this org
  DELETE FROM public.user_roles WHERE org_id = _org_id;

  -- Delete pending invites
  DELETE FROM public.org_invites WHERE org_id = _org_id;
END;
$$;

-- Update the SELECT policy on organizations to exclude archived orgs
DROP POLICY IF EXISTS "Users can view their own org" ON public.organizations;
CREATE POLICY "Users can view their own org" ON public.organizations
FOR SELECT USING (
  id = get_user_org_id(auth.uid()) AND archived_at IS NULL
);