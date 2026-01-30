-- Enable realtime for all necessary tables
-- This allows Supabase realtime subscriptions to work for automatic UI updates
-- This migration safely adds tables to the realtime publication, skipping if already added

-- Helper function to safely add table to realtime publication
DO $$ 
DECLARE
  table_name text;
  tables_to_add text[] := ARRAY[
    'tasks',
    'portfolios',
    'programs',
    'projects',
    'team_members',
    'milestones',
    'contacts',
    'subtasks',
    'project_members',
    'notifications'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables_to_add
  LOOP
    -- Check if table is already in the publication
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = table_name
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
    END IF;
  END LOOP;
END $$;
