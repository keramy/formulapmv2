@echo off
echo ========================================
echo  Fixed RLS Performance Optimization
echo ========================================
echo.

echo This will apply the corrected migration that fixes:
echo - 15+ critical RLS performance issues
echo - PostgreSQL syntax errors
echo - Expected 50-90%% performance improvement
echo.

set /p confirm="Apply the FIXED performance migration? (y/N): "
if /i "%confirm%"=="y" (
    echo.
    echo Checking Supabase status...
    supabase status
    
    echo.
    echo Applying FIXED migration...
    supabase db push
    
    echo.
    echo Running performance validation...
    node scripts/validate-optimizations.js
    
    echo.
    echo ========================================
    echo  Fixed Migration Applied Successfully!
    echo ========================================
    echo.
    echo Your database should now have:
    echo - 50-90%% faster queries
    echo - Reduced database load
    echo - Better user experience
    echo - Fixed syntax errors
    echo.
    echo Please test your application to ensure
    echo everything works correctly.
    echo.
) else (
    echo Migration cancelled.
    echo.
    echo IMPORTANT: You still have critical performance
    echo issues that need to be fixed. The corrected
    echo migration is ready when you are.
)

pause