-- Add estimated_hours column to tasks table
-- This represents the number of hours the task requires
-- Base allocation = estimated_hours × 1 (base weight)
-- Then multipliers are applied on top

ALTER TABLE public.tasks 
ADD COLUMN estimated_hours numeric(5,2) NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.tasks.estimated_hours IS 'Estimated hours required to complete the task. Base allocation = hours × 1, then multipliers are applied.';