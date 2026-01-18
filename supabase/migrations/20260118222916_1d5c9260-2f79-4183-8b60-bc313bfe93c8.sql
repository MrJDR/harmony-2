-- Allow users to update their own invites (mark as accepted) by matching their email
CREATE POLICY "Users can accept their own invites"
ON public.org_invites
FOR UPDATE
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));