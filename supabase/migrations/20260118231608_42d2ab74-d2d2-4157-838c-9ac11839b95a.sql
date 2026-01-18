-- Add start_date and end_date columns to programs table
ALTER TABLE public.programs 
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE;