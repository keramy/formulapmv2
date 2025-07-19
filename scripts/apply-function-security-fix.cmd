@echo off
echo 🔐 Applying Database Function Security Fix...
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js and try again
    pause
    exit /b 1
)

REM Check if required packages are installed
if not exist "node_modules" (
    echo ❌ Node modules not found. Please run 'npm install' first
    pause
    exit /b 1
)

REM Run the security fix script
node scripts/fix-function-security.js

if errorlevel 1 (
    echo.
    echo ❌ Security fix failed. Check the output above for details.
    pause
    exit /b 1
) else (
    echo.
    echo ✅ Security fix completed successfully!
    echo.
    echo 📋 What to do next:
    echo    1. Check Supabase Performance Advisor to confirm warnings are cleared
    echo    2. Test your application to ensure functions work correctly
    echo    3. Consider running a full security audit
    echo.
)

pause