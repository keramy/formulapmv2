Diagnose and fix authentication issues in the Formula PM V2 application.

Check these common issues:
1. RLS policies causing infinite recursion
2. JWT token usage in hooks (should use getAccessToken(), not profile.id)
3. User profiles missing in database
4. Stale authentication sessions in browser
5. Environment variables misconfiguration

Provide specific SQL commands and code fixes for any issues found.

$ARGUMENTS