# Authentication Guide - Formula PM 2.0

## 🔐 How Authentication Works

### Where Credentials are Stored

1. **Emails (Usernames)**: Stored in `auth.users.email` column
2. **Passwords**: Stored in `auth.users.encrypted_password` as bcrypt hashes
3. **User Profiles**: Stored in `user_profiles` table (linked by user ID)
4. **Sessions**: Managed by Supabase Auth with JWT tokens

### Authentication Flow

```
User Login → LoginForm.tsx → useAuth.ts → supabase.auth.signInWithPassword()
                                              ↓
                                        auth.users table
                                              ↓
                                        JWT token returned
                                              ↓
                                        Profile loaded from user_profiles
```

### Password Storage

Passwords are **NEVER** stored in plain text. They are:
1. Hashed using bcrypt with salt
2. Stored in `auth.users.encrypted_password`
3. Verified by Supabase Auth service

## ✅ Working Test Credentials

| Email | Password | Role | Status |
|-------|----------|------|--------|
| admin@formulapm.com | admin123 | Admin | ✅ Working |
| owner.test@formulapm.com | testpass123 | Management | ✅ Working |
| pm.working@formulapm.com | testpass123 | Project Manager | ✅ Working |
| admin.working@formulapm.com | testpass123 | Admin | ✅ Working |
| client.working@formulapm.com | testpass123 | Client | ✅ Working |

## 🔧 Creating New Users

### Method 1: Using JavaScript (Recommended)
```javascript
// Use the create-admin-user.mjs script
node create-admin-user.mjs
```

### Method 2: Using SQL
```sql
-- Users must be created in BOTH auth.users AND user_profiles
-- See sql-user-creation-example.sql for full example
```

### Method 3: Using Supabase Studio
1. Open http://127.0.0.1:54323
2. Go to Authentication → Users
3. Click "Add User"

## ❌ Common Issues

### "Invalid login credentials"
- **Cause**: User exists in `user_profiles` but not in `auth.users`
- **Fix**: Create user using admin API or script

### "Database error creating new user"
- **Cause**: Constraints or triggers preventing user creation
- **Fix**: Use new email that doesn't exist in any table

### Users can't login after migration
- **Cause**: Migration creates profiles but not auth users
- **Fix**: Run `fix-test-users.mjs` or create manually

## 📁 Important Files

- **Frontend**: `src/components/auth/LoginForm.tsx`
- **Hook**: `src/hooks/useAuth.ts`
- **Config**: `src/lib/supabase.ts`
- **Scripts**: 
  - `create-admin-user.mjs` - Create single admin
  - `user-creation-template.mjs` - Bulk user creation
  - `diagnose-auth-complete.mjs` - Debug auth issues

## 🎯 Key Points

1. **Two Tables Required**: Both `auth.users` AND `user_profiles` must have entries
2. **Passwords**: Set via Supabase Auth API, not direct SQL
3. **Email Confirmation**: Set `email_confirm: true` when creating users
4. **RLS Policies**: Don't affect auth operations (uses service role)
5. **JWT Tokens**: Automatically managed by Supabase Auth

## 🚀 Quick Start

```bash
# Test login with admin
Email: admin@formulapm.com
Password: admin123

# Create new user
node create-admin-user.mjs

# Debug auth issues
node diagnose-auth-complete.mjs
```