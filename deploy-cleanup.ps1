# PowerShell script to deploy the cleanup-reports function
# Run this from the harmony-2 directory

Write-Host "=== Deploying Report Cleanup Function ===" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseInstalled) {
    Write-Host "Supabase CLI not found. Installing instructions:" -ForegroundColor Yellow
    Write-Host "1. Install via npm: npm install -g supabase" -ForegroundColor Yellow
    Write-Host "2. Or download from: https://github.com/supabase/cli/releases" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For now, please deploy manually via Supabase Dashboard:" -ForegroundColor Yellow
    Write-Host "1. Go to Edge Functions > Create Function" -ForegroundColor Yellow
    Write-Host "2. Name: cleanup-reports" -ForegroundColor Yellow
    Write-Host "3. Copy code from: supabase/functions/cleanup-reports/index.ts" -ForegroundColor Yellow
    exit 1
}

Write-Host "Deploying cleanup-reports function..." -ForegroundColor Green
supabase functions deploy cleanup-reports

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Function deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Go to Supabase Dashboard > Storage > Create bucket named 'reports' (if not exists)" -ForegroundColor Yellow
    Write-Host "2. Go to Database > Cron Jobs > Create new cron job:" -ForegroundColor Yellow
    Write-Host "   - Name: cleanup-old-reports" -ForegroundColor Yellow
    Write-Host "   - Schedule: 0 2 * * *" -ForegroundColor Yellow
    Write-Host "   - SQL: See DEPLOY_CLEANUP.md for the SQL command" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or test manually:" -ForegroundColor Cyan
    Write-Host "curl -X POST https://bccdcbzdrwlmzholhdth.supabase.co/functions/v1/cleanup-reports -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "✗ Deployment failed. Check errors above." -ForegroundColor Red
    Write-Host "You may need to:" -ForegroundColor Yellow
    Write-Host "1. Login: supabase login" -ForegroundColor Yellow
    Write-Host "2. Link project: supabase link --project-ref bccdcbzdrwlmzholhdth" -ForegroundColor Yellow
}
