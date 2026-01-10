-- Create atomic org setup function to avoid RLS issues with INSERT ... RETURNING
-- This function creates org, sets profile.org_id, and inserts owner role in one secure step.

CREATE OR REPLACE FUNCTION public.create_organization_and_assign_owner(
  _name text,
  _slug text
)
RETURNS public.organizations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org public.organizations;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- user must exist in profiles and must not already belong to an org
  IF EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.org_id IS NOT NULL) THEN
    RAISE EXCEPTION 'already_in_org';
  END IF;

  -- Create organization
  INSERT INTO public.organizations(name, slug)
  VALUES (trim(_name), trim(_slug))
  RETURNING * INTO v_org;

  -- Attach user to org
  UPDATE public.profiles
  SET org_id = v_org.id,
      updated_at = now()
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_missing';
  END IF;

  -- Create owner role
  INSERT INTO public.user_roles(user_id, org_id, role)
  VALUES (auth.uid(), v_org.id, 'owner');

  RETURN v_org;
END;
$$;

-- Allow authenticated callers to execute the function
GRANT EXECUTE ON FUNCTION public.create_organization_and_assign_owner(text, text) TO authenticated;