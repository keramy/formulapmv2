# Formula PM 2.0 Analysis Summary

**Generated:** 2025-07-16T14:27:33.053Z
**Version:** 1.0.0

## Overview

- **Total Issues:** 1878
- **Critical Issues:** 43
- **High Priority:** 7
- **Medium Priority:** 67
- **Low Priority:** 1761
- **Production Blockers:** 43
- **Estimated Effort:** 2332 hours

## Production Blockers

- **SQL Injection Risk in src\app\api\admin\auth-state\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\admin\create-test-users\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\admin\reset-auth\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\admin\users\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\auth\diagnostics\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\auth\recover-profile\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\auth\reset-password\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\dashboard\recent-activity\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\debug\create-test-profiles\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\material-specs\bulk\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\material-specs\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\material-specs\statistics\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\material-specs\[id]\approve\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\material-specs\[id]\link-scope\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\material-specs\[id]\reject\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\material-specs\[id]\request-revision\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\material-specs\[id]\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\material-specs\[id]\unlink-scope\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\milestones\bulk\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\milestones\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\milestones\statistics\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\milestones\[id]\status\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\projects\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\projects\[id]\assignments\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\projects\[id]\material-specs\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\projects\[id]\milestones\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\projects\[id]\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\projects\[id]\tasks\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\reports\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\reports\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\reports\[id]\generate-pdf\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\reports\[id]\publish\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\scope\bulk\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\scope\excel\export\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\scope\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\scope\[id]\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\shop-drawings\[id]\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\shop-drawings\[id]\submissions\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\shop-drawings\[id]\submit\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\suppliers\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\tasks\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\tasks\statistics\route.ts**: Potential SQL injection vulnerability detected
- **SQL Injection Risk in src\app\api\test-auth\route.ts**: Potential SQL injection vulnerability detected

## Next Steps

1. Address all critical issues and production blockers
2. Prioritize high-priority issues based on user impact
3. Plan medium and low priority fixes for future releases
4. Review detailed reports for specific recommendations

## Detailed Reports

- Full JSON report: `analysis-report.json`
- Interactive HTML report: `analysis-report.html`
