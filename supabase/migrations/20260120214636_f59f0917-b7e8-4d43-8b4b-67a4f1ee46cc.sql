-- Add budget fields to projects table for budget tracking
ALTER TABLE public.projects
ADD COLUMN budget numeric DEFAULT 0,
ADD COLUMN actual_cost numeric DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.projects.budget IS 'Planned budget for the project';
COMMENT ON COLUMN public.projects.actual_cost IS 'Actual cost spent on the project';