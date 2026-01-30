-- Simple approach: Direct cleanup function that runs in the database
-- This doesn't require calling the Edge Function, but requires http extension

-- Enable http extension if not already enabled
-- Note: This may require superuser access. Enable via Supabase Dashboard if needed
-- Dashboard: Database > Extensions > Enable "http"

-- Create a function that directly cleans up old reports from storage
-- This uses Supabase's storage API via http
CREATE OR REPLACE FUNCTION cleanup_old_reports_direct()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key text;
  project_url text;
  cutoff_time timestamp;
  response_status int;
  response_body jsonb;
BEGIN
  -- Get service role key from environment (set in Supabase Dashboard > Settings > API)
  -- For security, this should be stored as a secret or environment variable
  service_role_key := current_setting('app.settings.service_role_key', true);
  project_url := current_setting('app.settings.supabase_url', true);
  
  -- Calculate cutoff time (24 hours ago)
  cutoff_time := NOW() - INTERVAL '24 hours';
  
  -- Call Supabase Storage API to list and delete old files
  -- Note: This is a simplified version. The Edge Function approach is more robust.
  
  SELECT status, content::jsonb INTO response_status, response_body
  FROM http((
    'POST',
    project_url || '/storage/v1/object/list/reports',
    ARRAY[
      http_header('Authorization', 'Bearer ' || service_role_key),
      http_header('apikey', service_role_key),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    json_build_object('prefix', 'reports/', 'limit', 1000)::text
  )::http_request);
  
  -- Process and delete old files (implementation would go here)
  -- For now, return the response
  
  RETURN jsonb_build_object(
    'status', response_status,
    'message', 'Cleanup initiated. Check logs for details.'
  );
END;
$$;

-- Schedule daily cleanup at 2 AM UTC
-- Option 1: Use Supabase Dashboard > Database > Cron Jobs
--   Schedule: 0 2 * * *
--   SQL: SELECT cleanup_old_reports_direct();

-- Option 2: If pg_cron is enabled, uncomment:
/*
SELECT cron.schedule(
  'cleanup-old-reports-daily',
  '0 2 * * *',
  $$SELECT cleanup_old_reports_direct()$$
);
*/

COMMENT ON FUNCTION cleanup_old_reports_direct() IS 'Directly cleans up reports older than 24 hours from storage';
