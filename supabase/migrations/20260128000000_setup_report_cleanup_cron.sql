-- Enable pg_cron extension if not already enabled
-- Note: This requires superuser access. If you don't have it, enable via Supabase Dashboard
-- Dashboard: Database > Extensions > Enable "pg_cron"

-- Create a function to call the cleanup-reports edge function
CREATE OR REPLACE FUNCTION cleanup_old_reports()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_status int;
  response_body jsonb;
BEGIN
  -- Call the Supabase Edge Function
  -- Note: Replace YOUR_PROJECT_REF with your actual Supabase project reference
  -- You can find this in your Supabase dashboard URL or config.toml
  
  SELECT status, content::jsonb INTO response_status, response_body
  FROM http((
    'POST',
    'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-reports',
    ARRAY[
      http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    '{}'
  )::http_request);
  
  -- Log the result (optional)
  RAISE NOTICE 'Cleanup response: Status %, Body %', response_status, response_body;
END;
$$;

-- Schedule the cleanup to run daily at 2 AM UTC
-- Note: This requires pg_cron extension to be enabled
-- If pg_cron is not available, use Supabase Dashboard > Database > Cron Jobs instead

-- Uncomment the following if pg_cron is enabled:
/*
SELECT cron.schedule(
  'cleanup-old-reports',           -- Job name
  '0 2 * * *',                     -- Cron schedule: Daily at 2 AM UTC
  $$SELECT cleanup_old_reports()$$ -- Function to run
);
*/

-- Alternative: If you prefer to use Supabase's built-in cron system:
-- 1. Go to Supabase Dashboard > Database > Cron Jobs
-- 2. Create a new cron job
-- 3. Schedule: 0 2 * * * (daily at 2 AM UTC)
-- 4. SQL: SELECT cleanup_old_reports();

COMMENT ON FUNCTION cleanup_old_reports() IS 'Calls the cleanup-reports edge function to delete reports older than 24 hours';
