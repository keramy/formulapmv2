-- Check if the user session is being properly stored
SELECT 'AUTH USERS' as table_name, id, email, last_sign_in_at, created_at 
FROM auth.users 
WHERE email = 'owner.test@formulapm.com';

-- Check user profile
SELECT 'USER PROFILES' as table_name, id, email, role, created_at 
FROM public.user_profiles 
WHERE email = 'owner.test@formulapm.com';

-- Check if there are any active sessions
SELECT 'ACTIVE SESSIONS' as table_name, id, user_id, created_at, updated_at, not_after
FROM auth.sessions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'owner.test@formulapm.com')
ORDER BY updated_at DESC
LIMIT 5;

-- Check refresh tokens
SELECT 'REFRESH TOKENS' as table_name, id, user_id, created_at, updated_at, revoked
FROM auth.refresh_tokens 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'owner.test@formulapm.com')::text
ORDER BY updated_at DESC
LIMIT 5;
EOF < /dev/null
