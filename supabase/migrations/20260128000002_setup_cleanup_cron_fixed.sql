-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the cleanup job to run daily at 2 AM UTC
-- Replace YOUR_SERVICE_ROLE_KEY with your actual service role key from Settings > API
SELECT cron.schedule(
  'cleanup-old-reports',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://bccdcbzdrwlmzholhdth.supabase.co/functions/v1/cleanup-reports',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) as request_id;
  $$
);

-- To verify the job was created:
-- SELECT * FROM cron.job WHERE jobname = 'cleanup-old-reports';

-- To remove the job later (if needed):
-- SELECT cron.unschedule('cleanup-old-reports');
