-- Add position columns for ordering tasks and subtasks
ALTER TABLE public.tasks
ADD COLUMN position integer NOT NULL DEFAULT 0;

ALTER TABLE public.subtasks
ADD COLUMN position integer NOT NULL DEFAULT 0;

-- Create indexes for efficient ordering queries
CREATE INDEX idx_tasks_project_position ON public.tasks(project_id, position);
CREATE INDEX idx_subtasks_task_position ON public.subtasks(task_id, position);