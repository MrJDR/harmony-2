-- Create a secure view that conditionally exposes email based on viewer's role
-- Admins and managers can see all emails, others only see their own email

CREATE OR REPLACE VIEW public.profiles_safe AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.avatar_url,
  p.org_id,
  p.created_at,
  p.updated_at,
  -- Only show email if viewer is admin/manager OR viewing their own profile
  CASE 
    WHEN p.id = auth.uid() THEN p.email
    WHEN has_min_org_role(auth.uid(), 'manager'::app_role) THEN p.email
    ELSE NULL
  END AS email
FROM public.profiles p
WHERE p.org_id = get_user_org_id(auth.uid()) OR p.id = auth.uid();

-- Grant access to the view for authenticated users
GRANT SELECT ON public.profiles_safe TO authenticated;

-- Add comment explaining the security purpose
COMMENT ON VIEW public.profiles_safe IS 'Secure view of profiles that hides email addresses from non-admin members to prevent spam/phishing. Admins and managers can see all emails.';