-- One-time data cleanup for user jdr.flowers@gmail.com who was incorrectly removed
-- This cleans up all remaining org access

-- Delete team_member record
DELETE FROM public.team_members WHERE id = 'a466e80f-bf95-45b7-96c9-3ed2048af6ef';

-- Delete contact record (was created for org membership)
DELETE FROM public.contacts WHERE id = '95075587-a436-4b9c-9bce-01fda23afc6c';

-- Clear org_id from profile
UPDATE public.profiles 
SET org_id = NULL, updated_at = now()
WHERE id = '93cceece-a86c-4678-a138-d3083bc90528';