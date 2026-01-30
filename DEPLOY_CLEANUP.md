# Deploy Report Cleanup - Step by Step

Follow these steps to set up automatic cleanup of reports older than 24 hours.

## Step 1: Create the Storage Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Storage** in the left sidebar
4. Click **New bucket**
5. Name it: `reports`
6. Make it **Public** (or set up RLS policies if you prefer private)
7. Click **Create bucket**

## Step 2: Deploy the Edge Function

### Option A: Using Supabase CLI (if you have it installed)

```bash
cd harmony-2
supabase functions deploy cleanup-reports
```

### Option B: Using Supabase Dashboard

1. Go to **Edge Functions** in your Supabase Dashboard
2. Click **Create a new function**
3. Name it: `cleanup-reports`
4. Copy the contents from `supabase/functions/cleanup-reports/index.ts`
5. Paste into the function editor
6. Click **Deploy**

## Step 3: Set Up the Cron Job

1. Go to **Database** > **Cron Jobs** (or look for **Scheduled Jobs**)
2. Click **Create New Cron Job** or **New Schedule**
3. Configure:
   - **Name**: `cleanup-old-reports`
   - **Schedule**: `0 2 * * *` (runs daily at 2 AM UTC)
   - **SQL Command**: Copy and paste the SQL below (replace placeholders first!)

### Get Your Project Details

1. Go to **Settings** > **API**
2. Find your **Project URL** (looks like: `https://xxxxx.supabase.co`)
3. Find your **service_role key** (the secret one, not the anon key)

### SQL Command for Cron Job

Replace `YOUR_PROJECT_REF` and `YOUR_SERVICE_ROLE_KEY` in this SQL:

```sql
SELECT net.http_post(
  url := 'https://bccdcbzdrwlmzholhdth.supabase.co/functions/v1/cleanup-reports',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
  ),
  body := '{}'::jsonb
);
```

**Note**: Your project reference is `bccdcbzdrwlmzholhdth` (from config.toml), so the URL is already correct. Just replace `YOUR_SERVICE_ROLE_KEY` with your actual service role key.

## Step 4: Test It

After setting up, test the function manually:

1. Go to **Edge Functions** > **cleanup-reports** > **Invoke**
2. Or use curl:
   ```bash
   curl -X POST https://bccdcbzdrwlmzholhdth.supabase.co/functions/v1/cleanup-reports \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json"
   ```

## That's It!

The cleanup will now run automatically every day at 2 AM UTC and delete reports older than 24 hours.

## Check Logs

To see what happened:
1. Go to **Edge Functions** > **cleanup-reports** > **Logs**
2. You'll see how many files were deleted
