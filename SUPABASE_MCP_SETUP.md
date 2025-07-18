# Supabase MCP Server Setup Instructions

## Issue Diagnosis
The Supabase MCP server was failing to start because it requires a **personal access token** from Supabase cloud, not just local database credentials.

## Root Cause
The `@supabase/mcp-server-supabase` package is designed to work with **Supabase Cloud** projects, not local instances. It requires:
1. A personal access token from your Supabase account
2. A project reference ID from your cloud project

## Solution Steps

### 1. Create a Personal Access Token
1. Go to https://supabase.com/dashboard/account/tokens
2. Click "Generate new token"
3. Give it a descriptive name like "Claude MCP Server"
4. Copy the token (you won't be able to see it again)

### 2. Get Your Project Reference
1. Go to your Supabase project dashboard
2. Navigate to Settings → General
3. Find your "Project ID" (this is your project reference)

### 3. Update the MCP Configuration
Edit `.mcp.json` and replace the placeholder values:
```json
{
  "supabase": {
    "command": "npx",
    "args": ["-y", "@supabase/mcp-server-supabase@latest", "--read-only", "--project-ref=YOUR_PROJECT_REF"],
    "env": {
      "SUPABASE_ACCESS_TOKEN": "YOUR_PERSONAL_ACCESS_TOKEN_HERE"
    }
  }
}
```

Replace:
- `YOUR_PROJECT_REF` with your actual project ID
- `YOUR_PERSONAL_ACCESS_TOKEN_HERE` with your personal access token

### 4. Security Recommendations
- Use `--read-only` flag to prevent write operations
- Consider creating a separate development project for MCP access
- Don't commit the access token to version control
- Use project scoping to limit access to specific projects

### 5. Alternative: Environment Variable Setup
Instead of putting the token in the config file, you can set it globally:
```bash
# Windows
set SUPABASE_ACCESS_TOKEN=your_token_here

# PowerShell
$env:SUPABASE_ACCESS_TOKEN="your_token_here"
```

Then update the config to remove the env section:
```json
{
  "supabase": {
    "command": "npx",
    "args": ["-y", "@supabase/mcp-server-supabase@latest", "--read-only", "--project-ref=YOUR_PROJECT_REF"]
  }
}
```

## Testing the Setup
After updating the configuration, restart Claude Code and check if the Supabase MCP server starts successfully. You should see it listed as active in the MCP status.

## Local Development Note
If you want to work with your local Supabase instance instead, you might need to use a different MCP server implementation or create a custom one, as the official `@supabase/mcp-server-supabase` is designed for cloud projects.

## Status After Fix
- ✅ Package exists and is installable
- ✅ Local Supabase instance is running
- ✅ Configuration updated with proper format
- ⚠️ Requires personal access token and project reference to complete setup