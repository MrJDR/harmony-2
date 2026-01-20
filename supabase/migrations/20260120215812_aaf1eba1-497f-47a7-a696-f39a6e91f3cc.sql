-- Add budget fields to programs table
ALTER TABLE public.programs
ADD COLUMN budget numeric DEFAULT 0,
ADD COLUMN allocated_budget numeric DEFAULT 0;

COMMENT ON COLUMN public.programs.budget IS 'Total budget for the program';
COMMENT ON COLUMN public.programs.allocated_budget IS 'Budget allocated to projects within this program';

-- Add actual_cost field to tasks table for cost tracking
ALTER TABLE public.tasks
ADD COLUMN actual_cost numeric DEFAULT 0;

COMMENT ON COLUMN public.tasks.actual_cost IS 'Actual cost incurred for this task';

-- Add allocated_budget to projects for tracking what was allocated from program
ALTER TABLE public.projects
ADD COLUMN allocated_budget numeric DEFAULT 0;

COMMENT ON COLUMN public.projects.allocated_budget IS 'Budget allocated from program to this project';