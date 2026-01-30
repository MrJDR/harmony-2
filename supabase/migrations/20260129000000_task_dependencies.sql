-- Task dependencies for scheduling cascade
CREATE TABLE IF NOT EXISTS public.task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  predecessor_task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  successor_task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('blocks', 'relates_to')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(predecessor_task_id, successor_task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_org ON public.task_dependencies(org_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_predecessor ON public.task_dependencies(predecessor_task_id);

ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage task_dependencies"
ON public.task_dependencies
FOR ALL
USING (org_id = get_user_org_id(auth.uid()))
WITH CHECK (org_id = get_user_org_id(auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.task_dependencies;
