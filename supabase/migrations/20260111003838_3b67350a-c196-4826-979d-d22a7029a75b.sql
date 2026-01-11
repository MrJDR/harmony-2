-- Create messages table for storing sent/received messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id),
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT 'sent',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their org
CREATE POLICY "Users can view messages in their org"
ON public.messages
FOR SELECT
USING (org_id = get_user_org_id(auth.uid()));

-- Members can create messages
CREATE POLICY "Members can create messages"
ON public.messages
FOR INSERT
WITH CHECK (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'member'::app_role));

-- Members can update messages (mark as read, move to folder)
CREATE POLICY "Members can update messages"
ON public.messages
FOR UPDATE
USING (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'member'::app_role));

-- Managers can delete messages
CREATE POLICY "Managers can delete messages"
ON public.messages
FOR DELETE
USING (org_id = get_user_org_id(auth.uid()) AND has_min_org_role(auth.uid(), 'manager'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_messages_org_folder ON public.messages(org_id, folder);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);