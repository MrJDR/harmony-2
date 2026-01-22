-- Create a comprehensive function to remove a user from an organization
-- This cleans up all related data and revokes all access

CREATE OR REPLACE FUNCTION public.remove_user_from_org(_user_id uuid, _org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _contact_id uuid;
  _team_member_id uuid;
BEGIN
  -- Verify caller has admin+ permissions for this org
  IF NOT has_min_org_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'insufficient_permissions';
  END IF;

  -- Verify caller's org matches target org
  IF get_user_org_id(auth.uid()) != _org_id THEN
    RAISE EXCEPTION 'wrong_organization';
  END IF;

  -- 1. Delete watched items for this user in this org
  DELETE FROM public.watched_items 
  WHERE user_id = _user_id AND org_id = _org_id;

  -- 2. Delete notifications for this user in this org
  DELETE FROM public.notifications 
  WHERE user_id = _user_id AND org_id = _org_id;

  -- 3. Find team_member record(s) for this user via their email in contacts
  -- First get the user's email
  FOR _contact_id, _team_member_id IN
    SELECT c.id, tm.id
    FROM public.contacts c
    JOIN public.team_members tm ON tm.contact_id = c.id AND tm.org_id = _org_id
    WHERE c.email = (SELECT email FROM public.profiles WHERE id = _user_id)
    AND c.org_id = _org_id
  LOOP
    -- 4. Delete project_members referencing this team_member
    DELETE FROM public.project_members 
    WHERE member_id = _team_member_id AND org_id = _org_id;

    -- 5. Unassign tasks assigned to this team_member
    UPDATE public.tasks 
    SET assignee_id = NULL 
    WHERE assignee_id = _team_member_id AND org_id = _org_id;

    -- 6. Unassign subtasks assigned to this team_member
    UPDATE public.subtasks 
    SET assignee_id = NULL 
    WHERE assignee_id = _team_member_id AND org_id = _org_id;

    -- 7. Delete the team_member record
    DELETE FROM public.team_members 
    WHERE id = _team_member_id;

    -- 8. Delete the contact record (optional - keeps CRM clean)
    -- Only delete if this contact was created for the user
    DELETE FROM public.contacts 
    WHERE id = _contact_id 
    AND org_id = _org_id
    AND role = 'Team Member';
  END LOOP;

  -- 9. Delete user_roles for this user in this org
  DELETE FROM public.user_roles 
  WHERE user_id = _user_id AND org_id = _org_id;

  -- 10. Remove org_id from user's profile
  UPDATE public.profiles 
  SET org_id = NULL, updated_at = now()
  WHERE id = _user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.remove_user_from_org(uuid, uuid) TO authenticated;