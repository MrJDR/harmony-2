-- Add archived_at column to programs table
ALTER TABLE public.programs 
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone DEFAULT NULL;

-- Add archived_at column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone DEFAULT NULL;

-- Add archived_at column to tasks table for future use
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone DEFAULT NULL;