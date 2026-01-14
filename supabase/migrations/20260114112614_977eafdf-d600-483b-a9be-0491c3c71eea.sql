-- Create a function to automatically create contact and team_member for new org users
CREATE OR REPLACE FUNCTION public.handle_user_org_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _contact_id uuid;
  _user_name text;
BEGIN
  -- Only proceed if org_id is being set (not null)
  IF NEW.org_id IS NOT NULL AND (OLD.org_id IS NULL OR OLD.org_id != NEW.org_id) THEN
    -- Build user name from first_name and last_name, or use email
    _user_name := COALESCE(
      NULLIF(TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')), ''),
      SPLIT_PART(NEW.email, '@', 1)
    );
    
    -- Check if contact already exists for this email in this org
    SELECT id INTO _contact_id
    FROM public.contacts
    WHERE email = NEW.email AND org_id = NEW.org_id;
    
    -- If no contact exists, create one
    IF _contact_id IS NULL THEN
      INSERT INTO public.contacts (name, email, org_id, role)
      VALUES (_user_name, NEW.email, NEW.org_id, 'Team Member')
      RETURNING id INTO _contact_id;
    END IF;
    
    -- Check if team_member already exists for this contact
    IF NOT EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE contact_id = _contact_id AND org_id = NEW.org_id
    ) THEN
      -- Create team_member record
      INSERT INTO public.team_members (contact_id, org_id, capacity)
      VALUES (_contact_id, NEW.org_id, 40);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS on_user_org_assigned ON public.profiles;
CREATE TRIGGER on_user_org_assigned
  AFTER INSERT OR UPDATE OF org_id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_org_assignment();

-- Backfill: Create contacts and team_members for existing users who don't have them
DO $$
DECLARE
  _profile RECORD;
  _contact_id uuid;
  _user_name text;
BEGIN
  FOR _profile IN 
    SELECT p.id, p.email, p.first_name, p.last_name, p.org_id
    FROM public.profiles p
    WHERE p.org_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.contacts c 
      WHERE c.email = p.email AND c.org_id = p.org_id
    )
  LOOP
    -- Build user name
    _user_name := COALESCE(
      NULLIF(TRIM(COALESCE(_profile.first_name, '') || ' ' || COALESCE(_profile.last_name, '')), ''),
      SPLIT_PART(_profile.email, '@', 1)
    );
    
    -- Create contact
    INSERT INTO public.contacts (name, email, org_id, role)
    VALUES (_user_name, _profile.email, _profile.org_id, 'Team Member')
    RETURNING id INTO _contact_id;
    
    -- Create team_member
    INSERT INTO public.team_members (contact_id, org_id, capacity)
    VALUES (_contact_id, _profile.org_id, 40);
  END LOOP;
END;
$$;