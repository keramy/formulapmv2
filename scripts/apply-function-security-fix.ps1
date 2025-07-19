#!/usr/bin/env pwsh

Write-Host "🔐 Applying Database Function Security Fix..." -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is available
try {
    $supabaseVersion = supabase --version 2>$null
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Supabase CLI: npm install -g supabase" -ForegroundColor Yellow
    Write-Host "Or visit: https://supabase.com/docs/guides/cli/getting-started" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "📄 Applying migration using Supabase CLI..." -ForegroundColor Blue
Write-Host ""

# Apply the migration
try {
    supabase db push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 What to do next:" -ForegroundColor Cyan
        Write-Host "   1. Check Supabase Performance Advisor to confirm warnings are cleared" -ForegroundColor White
        Write-Host "   2. Test your application to ensure functions work correctly" -ForegroundColor White
        Write-Host "   3. Consider running a full security audit" -ForegroundColor White
        Write-Host ""
    } else {
        throw "Migration command failed"
    }
} catch {
    Write-Host ""
    Write-Host "❌ Migration failed. This could be because:" -ForegroundColor Red
    Write-Host "   1. Supabase is not running locally" -ForegroundColor Yellow
    Write-Host "   2. Database connection issues" -ForegroundColor Yellow
    Write-Host "   3. Migration syntax errors" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 Try these alternatives:" -ForegroundColor Cyan
    Write-Host "   1. Start Supabase: supabase start" -ForegroundColor White
    Write-Host "   2. Check connection: supabase status" -ForegroundColor White
    Write-Host "   3. Apply manually in Supabase SQL Editor" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Read-Host "Press Enter to exit"