-- Add custom status fields to programs table (similar to projects)
ALTER TABLE public.programs 
ADD COLUMN custom_statuses jsonb DEFAULT NULL,
ADD COLUMN custom_project_statuses jsonb DEFAULT NULL;