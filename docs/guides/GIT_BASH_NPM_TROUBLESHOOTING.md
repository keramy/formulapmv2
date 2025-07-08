# Git Bash NPM Troubleshooting Guide

## Problem
When using Git Bash on Windows, npm commands in git hooks may fail with:
```
/bin/bash: C:/Program Files/nodejs/npm: No such file or directory
husky - pre-commit hook exited with code 127 (error)
```

## Solutions

### Solution 1: Use Updated Pre-commit Hook (Recommended)
The pre-commit hook has been updated to handle Windows environments better. It now:
1. Detects Windows environment and uses cmd.exe when available
2. Tries multiple methods to find npm (npm, npm.cmd, direct paths)
3. Falls back to using node directly if npm is not found

### Solution 2: Bypass Pre-commit Hook (Temporary)
If you need to commit immediately:
```bash
git commit --no-verify -m "your message"
```

### Solution 3: Fix npm in Git Bash PATH
Add npm to your Git Bash PATH:
```bash
# Add to ~/.bashrc or ~/.bash_profile
export PATH="/c/Program Files/nodejs:$PATH"

# Reload shell
source ~/.bashrc
```

### Solution 4: Use Windows Command Prompt or PowerShell
If Git Bash continues to have issues:
```cmd
# In Command Prompt or PowerShell
git add .
git commit -m "your message"
git push
```

### Solution 5: Use Visual Studio Code Terminal
VS Code's integrated terminal often handles Windows paths better:
1. Open VS Code
2. Open integrated terminal (Ctrl+`)
3. Run git commands there

## How the Fix Works

### Pre-commit Hook Updates
1. **Windows Detection**: Checks for WINDIR/SYSTEMROOT environment variables
2. **CMD Fallback**: Uses pre-commit.cmd batch file on Windows
3. **Multiple npm Paths**: Tries npm, npm.cmd, and direct paths
4. **Node Fallback**: Uses node directly to run tsx if npm fails

### Files Modified
- `.husky/pre-commit` - Updated with cross-platform npm detection
- `.husky/pre-commit.cmd` - Windows-specific batch file

## Testing the Fix

### Test if npm is found:
```bash
# In Git Bash
which npm
npm --version

# Test the hook manually
./.husky/pre-commit
```

### Test commit with SQL files:
```bash
# Make a change to any SQL file
echo "-- test" >> supabase/migrations/test.sql
git add supabase/migrations/test.sql
git commit -m "test commit"
# Should run validation
git reset --hard HEAD~1  # Undo test commit
```

## Still Having Issues?

### Check Node.js Installation
```bash
# Should show Node.js path
where node
node --version

# Should show npm path
where npm
npm --version
```

### Reinstall Husky
```bash
# Remove and reinstall husky
rm -rf .husky
npm run prepare
```

### Debug the Hook
```bash
# Run with debug output
sh -x ./.husky/pre-commit
```

## Prevention

### For Future Projects
1. Test git hooks on Windows before implementing
2. Always provide cross-platform alternatives
3. Document Windows-specific setup requirements
4. Consider using npx directly instead of npm scripts in hooks

### Alternative Hook Implementation
Consider using Node.js directly in hooks:
```javascript
#!/usr/bin/env node
const { execSync } = require('child_process');
// JavaScript implementation of hook logic
```

This avoids shell compatibility issues entirely.