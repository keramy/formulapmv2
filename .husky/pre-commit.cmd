@echo off
echo Running pre-commit validation...

REM Check if any SQL files are being committed
git diff --cached --name-only | findstr "\.sql$" >nul
if %errorlevel% equ 0 (
    echo SQL files detected in commit, running validation...
    call npm run validate-migrations:ci
    if %errorlevel% neq 0 (
        echo SQL validation failed!
        echo Run 'npm run validate-migrations:fix' to auto-fix issues
        echo Run 'npm run validate-migrations:verbose' for detailed output
        exit /b 1
    )
    echo SQL validation passed
) else (
    echo No SQL files in commit, skipping validation
)

echo Pre-commit checks completed successfully!
exit /b 0