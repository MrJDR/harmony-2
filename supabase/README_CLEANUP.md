# Report Cleanup Setup

This document explains how to set up automatic cleanup of old reports from Supabase Storage.

## Overview

The `cleanup-reports` Edge Function automatically deletes PDF reports from the `reports` storage bucket that are older than 24 hours.

## Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. **Deploy the Edge Function**
   - The function is located at `supabase/functions/cleanup-reports/index.ts`
   - Deploy it using: `supabase functions deploy cleanup-reports`
   - Or use the Supabase Dashboard > Edge Functions > Deploy

2. **Set up Cron Job in Supabase Dashboard**
   - Go to your Supabase Dashboard
   - Navigate to **Database** > **Cron Jobs** (or **Scheduled Jobs**)
   - Click **Create New Cron Job**
   - Configure:
     - **Name**: `cleanup-old-reports`
     - **Schedule**: `0 2 * * *` (runs daily at 2 AM UTC)
     - **SQL Command**: 
       ```sql
       SELECT net.http_post(
         url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-reports',
         headers := jsonb_build_object(
           'Content-Type', 'application/json',
           'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
         ),
         body := '{}'::jsonb
       );
       ```
   - Replace:
     - `YOUR_PROJECT_REF` with your Supabase project reference (found in your project URL)
     - `YOUR_SERVICE_ROLE_KEY` with your service role key (found in Settings > API)

3. **Optional: Set CRON_SECRET for Security**
   - In Supabase Dashboard > Edge Functions > cleanup-reports > Settings
   - Add environment variable: `CRON_SECRET` with a random secure value
   - Update the cron job SQL to include: `'Authorization', 'Bearer YOUR_CRON_SECRET'`

### Option 2: Using pg_cron Extension

If you have access to enable the `pg_cron` extension:

1. **Enable pg_cron**
   - Go to Supabase Dashboard > Database > Extensions
   - Enable "pg_cron"

2. **Run the Migration**
   - The migration file `20260128000000_setup_report_cleanup_cron.sql` contains the setup
   - Update it with your project reference and service role key
   - Run it via Supabase Dashboard > SQL Editor

3. **Verify the Schedule**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'cleanup-old-reports';
   ```

## How It Works

1. The cleanup function runs daily (scheduled time)
2. It lists all files in the `reports` storage bucket
3. For each file, it checks if the `created_at` timestamp is older than 24 hours
4. Files older than 24 hours are deleted
5. Results are logged for monitoring

## Monitoring

Check the Edge Function logs in Supabase Dashboard to see:
- How many files were deleted
- Any errors that occurred
- Files that were kept (not yet 24h old)

## Manual Cleanup

You can also trigger cleanup manually:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-reports \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

## Troubleshooting

- **Function not found**: Make sure the function is deployed
- **No files deleted**: Check that files exist and are older than 24 hours
- **Permission errors**: Verify the service role key has storage access
- **Bucket doesn't exist**: Create the `reports` bucket in Storage first
