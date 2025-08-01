# Enable Leaked Password Protection in Supabase

To enable leaked password protection (checks against HaveIBeenPwned.org), follow these steps:

## Steps to Enable:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. Scroll down to **Password Security**
4. Toggle ON **"Enable leaked password protection"**
5. Click **Save**

## Benefits:
- Prevents users from using compromised passwords
- Automatically checks passwords against HaveIBeenPwned database
- Enhances overall security of your application
- No performance impact on login/signup

## Note:
This is a manual configuration in the Supabase dashboard and cannot be set via SQL migrations.

**Current Status**: ❌ Disabled (as detected by Supabase advisors)
**Recommended Status**: ✅ Enabled