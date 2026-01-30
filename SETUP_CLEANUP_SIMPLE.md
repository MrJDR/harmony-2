# Simple Setup: Report Cleanup

## Step 1: Create Storage Bucket

1. Go to: https://supabase.com/dashboard/project/bccdcbzdrwlmzholhdth/storage/buckets
2. Click **"New bucket"**
3. Name: `reports`
4. Make it **Public**
5. Click **"Create bucket"**

## Step 2: Deploy Edge Function

1. Go to: https://supabase.com/dashboard/project/bccdcbzdrwlmzholhdth/functions
2. Click **"Create a new function"**
3. Name: `cleanup-reports`
4. Copy ALL code from: `harmony-2/supabase/functions/cleanup-reports/index.ts`
5. Paste and click **"Deploy"**

## Step 3: Set Up Scheduled Job

### Find the Jobs Section

The Jobs/Cron section might be in different places:

**Option A: Direct Link**
- Try: https://supabase.com/dashboard/project/bccdcbzdrwlmzholhdth/integrations/cron/overview

**Option B: Through Dashboard**
1. Go to: https://supabase.com/dashboard/project/bccdcbzdrwlmzholhdth
2. Look in the left sidebar for:
   - **"Jobs"**
   - **"Cron"** 
   - **"Database" > "Cron Jobs"**
   - **"Integrations" > "Cron"**

**Option C: If Jobs section doesn't exist**

You can use the SQL Editor to set it up manually:

1. Go to: https://supabase.com/dashboard/project/bccdcbzdrwlmzholhdth/sql/new
2. Get your service_role key from: https://supabase.com/dashboard/project/bccdcbzdrwlmzholhdth/settings/api
3. Copy and paste this SQL (replace `YOUR_SERVICE_ROLE_KEY`):

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the cleanup job
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
```

**Important**: Replace `YOUR_SERVICE_ROLE_KEY` with your actual service role key before running!

## Step 4: Test

1. Go to: https://supabase.com/dashboard/project/bccdcbzdrwlmzholhdth/functions/cleanup-reports
2. Click **"Invoke"** or **"Test"**
3. Should return: `{"success": true, "deleted": 0, ...}`

## Done!

The cleanup will run daily at 2 AM UTC.
