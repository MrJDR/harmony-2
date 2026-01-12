-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view messages in their org" ON public.messages;

-- Create a helper function to get current user's email
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE id = _user_id
$$;

-- Create new policy: Users can only view messages they sent or received
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
USING (
  org_id = get_user_org_id(auth.uid())
  AND (
    sender_id = auth.uid()
    OR recipient_email = get_user_email(auth.uid())
  )
);

-- Update the UPDATE policy to only allow sender to update their own sent messages
DROP POLICY IF EXISTS "Members can update messages" ON public.messages;
CREATE POLICY "Users can update their sent messages"
ON public.messages
FOR UPDATE
USING (
  org_id = get_user_org_id(auth.uid())
  AND sender_id = auth.uid()
);

-- Update the DELETE policy to only allow sender to delete their own messages
DROP POLICY IF EXISTS "Managers can delete messages" ON public.messages;
CREATE POLICY "Users can delete their sent messages"
ON public.messages
FOR DELETE
USING (
  org_id = get_user_org_id(auth.uid())
  AND sender_id = auth.uid()
);

-- Add comment explaining the security model
COMMENT ON TABLE public.messages IS 'Messages are private - only sender and recipient can view. Only sender can update/delete.';