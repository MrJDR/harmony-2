-- Step 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Schedule the cleanup job
-- IMPORTANT: Replace YOUR_SERVICE_ROLE_KEY with your actual service role key
-- Get it from: Settings > API > service_role key

SELECT cron.schedule(
  'cleanup-old-reports',
  '0 2 * * *',
  $sql$
  SELECT net.http_post(
    url := 'https://bccdcbzdrwlmzholhdth.supabase.co/functions/v1/cleanup-reports',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) as request_id;
  $sql$
);
