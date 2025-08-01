# PostgreSQL MCP Setup Guide for Formula PM V2

## 🚀 Quick Setup Steps

### Step 1: Get Your Supabase Database Connection String

1. Go to your Supabase dashboard
2. Navigate to Settings → Database
3. Find the "Connection string" section
4. Copy the "Connection pooling" URL (not direct connection)
5. It should look like: `postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres`

### Step 2: Update mcp-config.json

Replace the placeholder in your `mcp-config.json` with your actual database URL:

```json
"postgres": {
  "command": "npx",
  "args": [
    "-y",
    "@crystaldba/postgres-mcp-server@latest",
    "--access-mode=restricted"
  ],
  "env": {
    "DATABASE_URL": "YOUR_ACTUAL_SUPABASE_CONNECTION_STRING_HERE"
  }
}
```

### Step 3: Test the Connection

After updating the config, restart Claude Desktop to load the new MCP server.

## 🛠️ Alternative Installation Methods

### Method 2: Global NPM Install (For Better Performance)

```bash
# Install globally
npm install -g @crystaldba/postgres-mcp-server

# Update mcp-config.json to use global command
"postgres": {
  "command": "postgres-mcp-server",
  "args": ["--access-mode=restricted"],
  "env": {
    "DATABASE_URL": "YOUR_SUPABASE_CONNECTION_STRING"
  }
}
```

### Method 3: Manual Installation (For Development)

```bash
# Clone the repository
git clone https://github.com/crystaldba/postgres-mcp.git
cd postgres-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Update mcp-config.json to point to local build
"postgres": {
  "command": "node",
  "args": [
    "C:/path/to/postgres-mcp/dist/index.js",
    "--access-mode=restricted"
  ],
  "env": {
    "DATABASE_URL": "YOUR_SUPABASE_CONNECTION_STRING"
  }
}
```

## 🔐 Security Considerations

1. **Use Restricted Mode**: We set `--access-mode=restricted` to prevent accidental destructive operations
2. **Connection Pooling**: Use Supabase's pooler connection (port 6543) instead of direct connection
3. **SSL Required**: Always use `?sslmode=require` in your connection string
4. **Read-Only User**: Consider creating a read-only PostgreSQL user for analysis:

```sql
-- Run this in Supabase SQL Editor
CREATE USER analyst WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE postgres TO analyst;
GRANT USAGE ON SCHEMA public TO analyst;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analyst;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO analyst;
```

## 🧪 Testing Your Setup

Once installed, you can test with these MCP commands:

```
# List all schemas
list_schemas

# Check database health
analyze_db_health

# Find slow queries
get_top_queries

# Analyze a specific query
explain_query: "SELECT * FROM projects WHERE status = 'active'"
```

## 🔧 Troubleshooting

### Common Issues:

1. **Connection Refused**: Make sure you're using the pooler URL (port 6543), not direct connection
2. **SSL Error**: Ensure `?sslmode=require` is in your connection string
3. **Permission Denied**: Check that your database user has appropriate permissions
4. **MCP Not Loading**: Restart Claude Desktop after config changes

### Windows-Specific Notes:

- Use forward slashes in paths even on Windows
- If using global install, ensure npm global bin is in your PATH
- May need to use `npx.cmd` instead of `npx` in some environments

## 📊 Useful Queries for Your Project

After setup, try these performance analysis queries:

```sql
-- Analyze your dashboard stats query
explain_query: "SELECT COUNT(*) FROM projects WHERE status = 'active'"

-- Find missing indexes on foreign keys
analyze_workload_indexes

-- Check health of your optimized database
analyze_db_health

-- Find slow queries from your dashboard
get_top_queries
```

## 🔗 Resources

- [Postgres MCP GitHub](https://github.com/crystaldba/postgres-mcp)
- [Supabase Connection Pooling Docs](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [MCP Protocol Docs](https://modelcontextprotocol.io/)