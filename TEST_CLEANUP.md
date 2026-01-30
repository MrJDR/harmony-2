# Test the Cleanup Function

## Step 1: Verify the Cron Job is Scheduled

Run this SQL to check:

```sql
SELECT * FROM cron.job WHERE jobname = 'cleanup-old-reports';
```

You should see the job listed with schedule `0 2 * * *`.

## Step 2: Test the Function Manually

1. Go to: https://supabase.com/dashboard/project/bccdcbzdrwlmzholhdth/functions/cleanup-reports
2. Click **"Invoke"** or **"Test"** button
3. You should see a response like:
   ```json
   {
     "success": true,
     "deleted": 0,
     "failed": 0,
     "total": 0,
     "message": "No reports to clean up"
   }
   ```

## Step 3: Verify Storage Bucket Exists

1. Go to: https://supabase.com/dashboard/project/bccdcbzdrwlmzholhdth/storage/buckets
2. Make sure you see a bucket named `reports`
3. If not, create it (Public bucket)

## Step 4: Test with a Real Report

1. Send a test report via the "Send Update" button in your app
2. Wait a moment
3. Check Storage > reports bucket - you should see the PDF file
4. The cleanup will automatically delete it after 24 hours

## Done! ✅

The cleanup is now set up and will:
- Run daily at 2 AM UTC
- Delete reports older than 24 hours
- Log results in Edge Function logs

## Check Logs Later

After the first run (or test manually), check:
- Edge Functions > cleanup-reports > Logs
- You'll see how many files were deleted
