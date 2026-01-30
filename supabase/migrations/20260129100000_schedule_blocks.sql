-- Schedule blocks (manual, task, milestone) for calendar
CREATE TABLE IF NOT EXISTS public.schedule_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  title text NOT NULL,
  start_utc timestamptz NOT NULL,
  end_utc timestamptz NOT NULL,
  source_type text NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'task', 'milestone')),
  source_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedule_blocks_org ON public.schedule_blocks(org_id);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_assignee ON public.schedule_blocks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_start ON public.schedule_blocks(start_utc);

ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage schedule_blocks"
ON public.schedule_blocks
FOR ALL
USING (org_id = get_user_org_id(auth.uid()))
WITH CHECK (org_id = get_user_org_id(auth.uid()));

-- Stub for future external calendar sync
CREATE TABLE IF NOT EXISTS public.calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own calendar_connections"
ON public.calendar_connections
FOR ALL
USING (user_id = auth.uid() AND org_id = get_user_org_id(auth.uid()))
WITH CHECK (user_id = auth.uid() AND org_id = get_user_org_id(auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_blocks;
