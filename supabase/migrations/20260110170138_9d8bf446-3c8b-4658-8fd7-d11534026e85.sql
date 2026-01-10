-- =============================================
-- MULTI-TENANT ORGANIZATION ARCHITECTURE
-- =============================================

-- 1. Create role enums
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'manager', 'member', 'viewer');

-- 2. Organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 3. Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, org_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Organization invites table
CREATE TABLE public.org_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (org_id, email)
);

ALTER TABLE public.org_invites ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTIONS (avoid RLS recursion)
-- =============================================

-- Function to get user's org_id
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.profiles WHERE id = _user_id
$$;

-- Function to check if user has a specific role in their org
CREATE OR REPLACE FUNCTION public.has_org_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.id = _user_id AND p.org_id = ur.org_id
    WHERE ur.user_id = _user_id AND ur.role = _role
  )
$$;

-- Function to check if user has at least a certain role level
CREATE OR REPLACE FUNCTION public.has_min_org_role(_user_id UUID, _min_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.id = _user_id AND p.org_id = ur.org_id
    WHERE ur.user_id = _user_id 
    AND ur.role IN (
      CASE 
        WHEN _min_role = 'viewer' THEN 'owner'::app_role
        WHEN _min_role = 'member' THEN 'owner'::app_role
        WHEN _min_role = 'manager' THEN 'owner'::app_role
        WHEN _min_role = 'admin' THEN 'owner'::app_role
        WHEN _min_role = 'owner' THEN 'owner'::app_role
      END,
      CASE 
        WHEN _min_role IN ('viewer', 'member', 'manager', 'admin') THEN 'admin'::app_role
        ELSE NULL
      END,
      CASE 
        WHEN _min_role IN ('viewer', 'member', 'manager') THEN 'manager'::app_role
        ELSE NULL
      END,
      CASE 
        WHEN _min_role IN ('viewer', 'member') THEN 'member'::app_role
        ELSE NULL
      END,
      CASE 
        WHEN _min_role = 'viewer' THEN 'viewer'::app_role
        ELSE NULL
      END
    )
  )
$$;

-- Function to get user's role in their org
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role FROM public.user_roles ur
  JOIN public.profiles p ON p.id = _user_id AND p.org_id = ur.org_id
  WHERE ur.user_id = _user_id
  LIMIT 1
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Organizations: Users can only see their own org
CREATE POLICY "Users can view their own org"
  ON public.organizations FOR SELECT
  USING (id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Admins can update their org"
  ON public.organizations FOR UPDATE
  USING (id = public.get_user_org_id(auth.uid()) AND public.has_min_org_role(auth.uid(), 'admin'));

-- Profiles: Users can see profiles in their org
CREATE POLICY "Users can view profiles in their org"
  ON public.profiles FOR SELECT
  USING (org_id = public.get_user_org_id(auth.uid()) OR id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "System can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- User Roles: Users can see roles in their org
CREATE POLICY "Users can view roles in their org"
  ON public.user_roles FOR SELECT
  USING (org_id = public.get_user_org_id(auth.uid()));

CREATE POLICY "Admins can manage roles in their org"
  ON public.user_roles FOR ALL
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.has_min_org_role(auth.uid(), 'admin'));

-- Org Invites: Admins can manage invites
CREATE POLICY "Admins can view invites in their org"
  ON public.org_invites FOR SELECT
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.has_min_org_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create invites"
  ON public.org_invites FOR INSERT
  WITH CHECK (org_id = public.get_user_org_id(auth.uid()) AND public.has_min_org_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete invites"
  ON public.org_invites FOR DELETE
  USING (org_id = public.get_user_org_id(auth.uid()) AND public.has_min_org_role(auth.uid(), 'admin'));

-- Allow users to view invites sent to their email (for accepting)
CREATE POLICY "Users can view their own invites by email"
  ON public.org_invites FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- HANDLE NEW USER SIGNUP
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record RECORD;
  new_org_id UUID;
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

    -- Create user role with invited role
    INSERT INTO public.user_roles (user_id, org_id, role)
    VALUES (NEW.id, invite_record.org_id, invite_record.role);

    -- Mark invite as accepted
    UPDATE public.org_invites
    SET accepted_at = now()
    WHERE id = invite_record.id;
  ELSE
    -- New user without invite - create profile without org (will need to be added by admin)
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
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();