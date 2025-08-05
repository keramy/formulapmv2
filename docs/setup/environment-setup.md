# Environment Setup - Formula PM V2

## ⚠️ CRITICAL: Cloud-Only Development

**NO LOCAL SUPABASE** - All development connects directly to Supabase Cloud.

## Prerequisites

1. **Node.js** (v18.0.0 or higher)
2. **npm** or **yarn**
3. **Git**
4. **Supabase Cloud Account** with project created

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd formulapmv2
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Create `.env.local` file in project root:

```env
# Supabase Configuration (CLOUD ONLY)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3003
```

### 4. Verify Database Connection

```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL

# Should output your Supabase Cloud URL (NOT localhost)
# Example: https://xyzabc123.supabase.co
```

### 5. Database Setup Verification

Run these queries in Supabase SQL Editor to verify setup:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check test users
SELECT id, email, role 
FROM auth.users u
JOIN user_profiles p ON u.id = p.id
ORDER BY email;
```

## Working Credentials

**Admin User** (Cloud Database):
- Email: `admin@formulapm.com`
- Password: `admin123`
- Role: `admin`

## Development Server

### Start Development Server

```bash
npm run dev
# Server runs on http://localhost:3003
```

### Verify Server is Running

1. Open browser to http://localhost:3003
2. You should see the login page
3. Check browser console for any errors

## Common Setup Issues

### 1. Port Already in Use

If port 3003 is taken:

```bash
# Kill process on port 3003 (Windows)
netstat -ano | findstr :3003
taskkill /PID <PID> /F

# Or use different port
PORT=3004 npm run dev
```

### 2. Database Connection Failed

**Symptoms**: 
- 401 errors on API calls
- "Failed to fetch" errors

**Solutions**:
1. Verify `.env.local` exists and has correct values
2. Check Supabase project is active (not paused)
3. Verify anon key and URL match your project

### 3. Authentication Errors

**Symptoms**:
- Can't login with test credentials
- "Invalid credentials" error

**Solutions**:
1. Verify user exists in database:
   ```sql
   SELECT * FROM auth.users WHERE email = 'admin@formulapm.com';
   SELECT * FROM user_profiles WHERE email = 'admin@formulapm.com';
   ```

2. Reset password if needed:
   ```sql
   -- Run in Supabase SQL Editor
   UPDATE auth.users 
   SET encrypted_password = crypt('admin123', gen_salt('bf'))
   WHERE email = 'admin@formulapm.com';
   ```

### 4. Missing Dependencies

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Or with yarn
rm -rf node_modules yarn.lock
yarn install
```

## Build and Production

### Build for Production

```bash
npm run build
```

### Run Production Build Locally

```bash
npm run start
# Runs on http://localhost:3003
```

## Database Migrations

### Check Migration Status

```bash
# List all migrations
ls supabase/migrations/
```

### Validate Migrations

```bash
npm run validate-migrations
```

### Apply Migrations (via Supabase Dashboard)

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Run migration files in order

## TypeScript and Linting

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint

# Auto-fix lint issues
npm run lint:fix
```

## Monitoring and Debugging

### Check Application Logs

```bash
# Development logs
npm run dev

# Check browser console for client-side errors
# Check terminal for server-side errors
```

### Database Query Logs

In Supabase Dashboard:
1. Go to Database → Query Performance
2. Check slow queries
3. Review query patterns

## VS Code Setup (Recommended)

### Extensions
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense

### Settings (.vscode/settings.json)
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Troubleshooting Checklist

1. ✅ Environment variables set correctly
2. ✅ Database connection verified
3. ✅ Test user exists in database
4. ✅ Server running on correct port
5. ✅ No TypeScript errors
6. ✅ Dependencies installed
7. ✅ Migrations applied

## Getting Help

If issues persist after following this guide:
1. Check error logs in browser console
2. Check server logs in terminal
3. Verify database state in Supabase Dashboard
4. Review [Development Guidelines](../guides/development-guidelines.md)