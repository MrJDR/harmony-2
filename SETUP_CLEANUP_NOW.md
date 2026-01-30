# Quick Setup: Report Cleanup (5 Minutes)

Follow these exact steps to set up automatic cleanup.

## ✅ Step 1: Create Storage Bucket (1 minute)

1. Open: https://supabase.com/dashboard/project/bccdcbzdrwlmzholhdth/storage/buckets
2. Click **"New bucket"**
3. Name: `reports`
4. Make it **Public** ✓
5. Click **"Create bucket"**

## ✅ Step 2: Deploy Edge Function (2 minutes)

### Option A: Via Dashboard (Easiest)

1. Open: https://supabase.com/dashboard/project/bccdcbzdrwlmzholhdth/functions
2. Click **"Create a new function"**
3. Function name: `cleanup-reports`
4. Copy ALL code from: `harmony-2/supabase/functions/cleanup-reports/index.ts`
5. Paste into the code editor
6. Click **"Deploy"**

### Option B: Via CLI (if you have it)

```powershell
cd harmony-2
supabase functions deploy cleanup-reports
```

## ✅ Step 3: Set Up Cron Job (2 minutes)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/bccdcbzdrwlmzholhdth
2. Look for **"Jobs"** or **"Cron"** in the left sidebar (it might be under **Database** or **Integrations**)
3. If you don't see it, try: https://supabase.com/dashboard/project/bccdcbzdrwlmzholhdth/integrations/cron/overview
4. Click **"Create job"** or **"New Cron Job"**
5. Fill in:
   - **Name**: `cleanup-old-reports`
   - **Schedule**: `0 2 * * *` (daily at 2 AM UTC)
   - **Job Type**: Select **"HTTP Request"** or **"Edge Function"**
   - **URL/Function**: `cleanup-reports` (if Edge Function) or the full URL (if HTTP Request)
   - **Method**: POST
   - **Headers**: Add `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
   - **Body**: `{}` (empty JSON object)

### Get Your Service Role Key

1. Go to: https://supabase.com/dashboard/project/bccdcbzdrwlmzholhdth/settings/api
2. Find **"service_role"** key (the secret one)
3. Copy it

### If using HTTP Request job type:

- **URL**: `https://bccdcbzdrwlmzholhdth.supabase.co/functions/v1/cleanup-reports`
- **Method**: POST
- **Headers**: 
  - Key: `Authorization`
  - Value: `Bearer YOUR_SERVICE_ROLE_KEY` (replace with your actual key)
- **Body**: `{}`

### If using Edge Function job type:

- **Function**: Select `cleanup-reports` from the dropdown
- The function will be called automatically

6. Click **"Create"** or **"Save"**

## ✅ Step 4: Test It (30 seconds)

1. Go to: https://supabase.com/dashboard/project/bccdcbzdrwlmzholhdth/functions/cleanup-reports
2. Click **"Invoke function"** or **"Test"**
3. Check the response - should show `{"success": true, "deleted": 0, ...}`

## Done! 🎉

The cleanup will now run automatically every day at 2 AM UTC.

## Check Results

After it runs, check logs at:
- Edge Functions > cleanup-reports > Logs

You'll see how many files were deleted.
