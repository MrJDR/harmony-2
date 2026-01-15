-- Add columns for custom project workflow settings
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS custom_statuses jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS custom_task_statuses jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS custom_task_priorities jsonb DEFAULT NULL;

-- Add a comment explaining the schema
COMMENT ON COLUMN public.projects.custom_statuses IS 'Custom project status definitions as JSON array [{id, label, color}]';
COMMENT ON COLUMN public.projects.custom_task_statuses IS 'Custom task status definitions as JSON array [{id, label, color}]';
COMMENT ON COLUMN public.projects.custom_task_priorities IS 'Custom task priority definitions as JSON array [{id, label, color}]';