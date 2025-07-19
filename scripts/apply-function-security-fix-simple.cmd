@echo off
echo 🔐 Applying Database Function Security Fix (Simple Method)...
echo.

REM Check if Supabase CLI is available
supabase --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Supabase CLI is not installed or not in PATH
    echo Please install Supabase CLI: npm install -g supabase
    echo Or use: https://supabase.com/docs/guides/cli/getting-started
    pause
    exit /b 1
)

echo 📄 Applying migration using Supabase CLI...
echo.

REM Apply the migration
supabase db push

if errorlevel 1 (
    echo.
    echo ❌ Migration failed. This could be because:
    echo    1. Supabase is not running locally
    echo    2. Database connection issues
    echo    3. Migration syntax errors
    echo.
    echo 💡 Try these alternatives:
    echo    1. Start Supabase: supabase start
    echo    2. Check connection: supabase status
    echo    3. Apply manually in Supabase SQL Editor
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ✅ Migration applied successfully!
    echo.
    echo 📋 What to do next:
    echo    1. Check Supabase Performance Advisor to confirm warnings are cleared
    echo    2. Test your application to ensure functions work correctly
    echo    3. Run: node scripts/fix-function-security.js (to validate the fix)
    echo.
)

pause