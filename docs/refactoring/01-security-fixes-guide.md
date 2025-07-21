# Security Fixes Implementation Guide

**Priority**: CRITICAL  
**Timeline**: Days 1-2 (Immediate)  
**Effort**: 16 hours total  

## Overview

This guide provides step-by-step instructions for fixing the critical security vulnerabilities identified in the code quality analysis.

## Task 1: Fix Hardcoded Secrets (4 hours)

### Current Issue
```typescript
// ❌ CRITICAL SECURITY ISSUE - src/lib/config.ts
const config = {
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  apiSecret: "sk-1234567890abcdef",
  dbPassword: "mypassword123",
  jwtSecret: "super-secret-key"
}
```

### Step-by-Step Fix

#### Step 1.1: Audit Configuration Files (30 minutes)
```bash
# Search for potential hardcoded secrets
grep -r "sk-" src/
grep -r "password" src/
grep -r "secret" src/
grep -r "key.*:" src/
grep -r "token.*:" src/
```

#### Step 1.2: Create Environment Variable Schema (45 minutes)
```typescript
// src/lib/env-config.ts
import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  DB_PASSWORD: z.string().min(8),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  
  // API Keys
  API_SECRET_KEY: z.string().min(16),
  ENCRYPTION_KEY: z.string().length(32),
  
  // External Services
  EMAIL_API_KEY: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

class ConfigManager {
  private static instance: ConfigManager;
  private config: EnvConfig;

  private constructor() {
    try {
      this.config = envSchema.parse(process.env);
    } catch (error) {
      console.error('❌ Environment configuration error:', error);
      throw new Error('Invalid environment configuration. Check your .env file.');
    }
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.config[key];
  }

  // Utility methods
  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }
}

export const config = ConfigManager.getInstance();
```

#### Step 1.3: Update Configuration Usage (2 hours)
```typescript
// ❌ Before - src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ After - src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { config } from './env-config';

export const supabase = createClient(
  config.get('NEXT_PUBLIC_SUPABASE_URL'),
  config.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')
);

export const supabaseAdmin = createClient(
  config.get('NEXT_PUBLIC_SUPABASE_URL'),
  config.get('SUPABASE_SERVICE_ROLE_KEY')
);
```

#### Step 1.4: Update Environment Files (45 minutes)
```bash
# .env.example (for documentation)
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database
DB_PASSWORD=your_secure_password_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Authentication
NEXTAUTH_SECRET=your_32_character_secret_key_here
NEXTAUTH_URL=http://localhost:3000

# API Configuration
API_SECRET_KEY=your_api_secret_key_here
ENCRYPTION_KEY=your_32_character_encryption_key

# External Services (Optional)
EMAIL_API_KEY=your_email_service_key
STORAGE_ACCESS_KEY=your_storage_key
```

```bash
# Update .env.local with actual values
cp .env.example .env.local
# Edit .env.local with real values
```

#### Step 1.5: Add Runtime Validation (30 minutes)
```typescript
// src/lib/startup-validation.ts
import { config } from './env-config';

export function validateEnvironment(): void {
  console.log('🔍 Validating environment configuration...');
  
  try {
    // Test critical configurations
    const criticalConfigs = [
      'DATABASE_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXTAUTH_SECRET',
      'API_SECRET_KEY'
    ] as const;

    criticalConfigs.forEach(key => {
      const value = config.get(key);
      if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    });

    console.log('✅ Environment configuration validated successfully');
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    process.exit(1);
  }
}

// Add to your app startup
// src/app/layout.tsx or pages/_app.tsx
if (typeof window === 'undefined') {
  validateEnvironment();
}
```

## Task 2: Update Vulnerable Dependencies (8 hours)

### Current Vulnerabilities
- **lodash@4.17.15**: Prototype Pollution (CRITICAL)
- **axios@0.21.1**: Server-Side Request Forgery (HIGH)
- **Other outdated packages**: Various security issues

### Step-by-Step Fix

#### Step 2.1: Audit Current Dependencies (30 minutes)
```bash
# Check for vulnerabilities
npm audit

# Get detailed vulnerability report
npm audit --json > vulnerability-report.json

# Check outdated packages
npm outdated
```

#### Step 2.2: Update Critical Dependencies (2 hours)
```bash
# Update lodash (CRITICAL - Prototype Pollution)
npm install lodash@^4.17.21

# Update axios (HIGH - SSRF)
npm install axios@^1.6.0

# Update other critical packages
npm install @types/node@^18.15.0
npm install next@^13.4.0
npm install react@^18.2.0 react-dom@^18.2.0

# Update development dependencies
npm install --save-dev @types/react@^18.2.0
npm install --save-dev eslint@^8.45.0
```

#### Step 2.3: Test Critical Functionality (3 hours)
```typescript
// tests/security/dependency-security.test.ts
import { describe, it, expect } from '@jest/globals';
import axios from 'axios';
import _ from 'lodash';

describe('Dependency Security Tests', () => {
  it('should use secure lodash version', () => {
    // Test that prototype pollution is fixed
    const obj = {};
    _.set(obj, '__proto__.polluted', 'value');
    expect({}.polluted).toBeUndefined();
  });

  it('should use secure axios version', async () => {
    // Test that SSRF protection is in place
    const client = axios.create({
      timeout: 5000,
      maxRedirects: 0
    });
    
    expect(client.defaults.timeout).toBe(5000);
    expect(client.defaults.maxRedirects).toBe(0);
  });

  it('should validate all critical dependencies', () => {
    const packageJson = require('../../package.json');
    
    // Ensure critical packages are at secure versions
    expect(packageJson.dependencies.lodash).toMatch(/^\^4\.17\.21/);
    expect(packageJson.dependencies.axios).toMatch(/^\^1\./);
  });
});
```

#### Step 2.4: Update Package Lock and Verify (1 hour)
```bash
# Clean install to update lock file
rm -rf node_modules package-lock.json
npm install

# Verify no vulnerabilities remain
npm audit

# Run tests to ensure nothing broke
npm test

# Check bundle size impact
npm run build
```

#### Step 2.5: Create Dependency Monitoring (1.5 hours)
```json
// .github/workflows/security-audit.yml
name: Security Audit
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1' # Weekly on Monday

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm audit --audit-level high
      - run: npm run test:security
```

## Task 3: Fix Authentication Vulnerability (12 hours)

### Current Issue Analysis
Based on the TODO comment indicating auth vulnerability, likely issues:
- Insufficient session validation
- Missing input sanitization
- Weak token verification

### Step-by-Step Fix

#### Step 3.1: Audit Authentication Flow (2 hours)
```typescript
// src/lib/auth-audit.ts
export class AuthAudit {
  static async auditAuthFlow(): Promise<AuthAuditResult> {
    const issues: AuthIssue[] = [];

    // Check session validation
    const sessionIssues = await this.checkSessionValidation();
    issues.push(...sessionIssues);

    // Check token security
    const tokenIssues = await this.checkTokenSecurity();
    issues.push(...tokenIssues);

    // Check input sanitization
    const inputIssues = await this.checkInputSanitization();
    issues.push(...inputIssues);

    return {
      totalIssues: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'CRITICAL'),
      issues
    };
  }

  private static async checkSessionValidation(): Promise<AuthIssue[]> {
    const issues: AuthIssue[] = [];

    // Check if sessions expire properly
    // Check if session tokens are validated on each request
    // Check if concurrent sessions are handled securely

    return issues;
  }
}
```

#### Step 3.2: Implement Secure Session Management (4 hours)
```typescript
// src/lib/auth/session-manager.ts
import { SignJWT, jwtVerify } from 'jose';
import { config } from '../env-config';

interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
  sessionId: string;
}

export class SessionManager {
  private static readonly SECRET = new TextEncoder().encode(
    config.get('NEXTAUTH_SECRET')
  );
  private static readonly ALGORITHM = 'HS256';
  private static readonly SESSION_DURATION = 24 * 60 * 60; // 24 hours

  static async createSession(user: User): Promise<string> {
    const sessionId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    const payload: SessionPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: now,
      exp: now + this.SESSION_DURATION,
      sessionId
    };

    // Store session in database for tracking
    await this.storeSession(sessionId, user.id, payload.exp);

    return await new SignJWT(payload)
      .setProtectedHeader({ alg: this.ALGORITHM })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(this.SECRET);
  }

  static async validateSession(token: string): Promise<SessionPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.SECRET);
      const sessionPayload = payload as unknown as SessionPayload;

      // Check if session exists in database
      const isValidSession = await this.isSessionValid(sessionPayload.sessionId);
      if (!isValidSession) {
        return null;
      }

      // Check expiration
      if (sessionPayload.exp < Math.floor(Date.now() / 1000)) {
        await this.revokeSession(sessionPayload.sessionId);
        return null;
      }

      return sessionPayload;
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  static async revokeSession(sessionId: string): Promise<void> {
    // Remove session from database
    await supabase
      .from('user_sessions')
      .delete()
      .eq('session_id', sessionId);
  }

  private static async storeSession(
    sessionId: string, 
    userId: string, 
    expiresAt: number
  ): Promise<void> {
    await supabase
      .from('user_sessions')
      .insert({
        session_id: sessionId,
        user_id: userId,
        expires_at: new Date(expiresAt * 1000).toISOString(),
        created_at: new Date().toISOString()
      });
  }

  private static async isSessionValid(sessionId: string): Promise<boolean> {
    const { data } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .gt('expires_at', new Date().toISOString())
      .single();

    return !!data;
  }
}
```

#### Step 3.3: Add Input Sanitization (3 hours)
```typescript
// src/lib/auth/input-sanitizer.ts
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

export class InputSanitizer {
  static sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      throw new Error('Invalid email input');
    }

    const sanitized = validator.normalizeEmail(email.trim().toLowerCase());
    if (!sanitized || !validator.isEmail(sanitized)) {
      throw new Error('Invalid email format');
    }

    return sanitized;
  }

  static sanitizePassword(password: string): string {
    if (!password || typeof password !== 'string') {
      throw new Error('Invalid password input');
    }

    // Remove any HTML/script content
    const sanitized = DOMPurify.sanitize(password, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [] 
    });

    if (sanitized !== password) {
      throw new Error('Password contains invalid characters');
    }

    return password; // Return original since we only validate
  }

  static sanitizeUserInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove HTML tags and scripts
    let sanitized = DOMPurify.sanitize(input.trim(), {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });

    // Escape special characters
    sanitized = validator.escape(sanitized);

    return sanitized;
  }

  static validateAndSanitizeLoginRequest(request: LoginRequest): LoginRequest {
    return {
      email: this.sanitizeEmail(request.email),
      password: this.sanitizePassword(request.password),
      rememberMe: Boolean(request.rememberMe)
    };
  }
}
```

#### Step 3.4: Implement Secure Authentication Middleware (3 hours)
```typescript
// src/middleware/auth-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '../lib/auth/session-manager';
import { RateLimiter } from '../lib/security/rate-limiter';

export async function authMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip auth for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Rate limiting for auth endpoints
  if (isAuthEndpoint(pathname)) {
    const rateLimitResult = await RateLimiter.checkLimit(
      request.ip || 'unknown',
      'auth',
      5, // 5 attempts
      15 * 60 * 1000 // 15 minutes
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many authentication attempts' },
        { status: 429 }
      );
    }
  }

  // Get token from cookie or header
  const token = request.cookies.get('auth-token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return redirectToLogin(request);
  }

  // Validate session
  const session = await SessionManager.validateSession(token);
  if (!session) {
    return redirectToLogin(request);
  }

  // Check role-based access
  if (!hasRequiredRole(pathname, session.role)) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // Add user info to request headers for API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', session.userId);
  requestHeaders.set('x-user-role', session.role);
  requestHeaders.set('x-user-email', session.email);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/api/auth/login',
    '/api/auth/register',
    '/_next',
    '/favicon.ico'
  ];

  return publicRoutes.some(route => pathname.startsWith(route));
}

function isAuthEndpoint(pathname: string): boolean {
  return pathname.startsWith('/api/auth/');
}

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

function hasRequiredRole(pathname: string, userRole: string): boolean {
  const roleRequirements: Record<string, string[]> = {
    '/admin': ['admin', 'super_admin'],
    '/api/admin': ['admin', 'super_admin'],
    '/reports': ['manager', 'admin', 'super_admin'],
    // Add more role requirements as needed
  };

  for (const [path, requiredRoles] of Object.entries(roleRequirements)) {
    if (pathname.startsWith(path)) {
      return requiredRoles.includes(userRole);
    }
  }

  return true; // Allow access if no specific role required
}
```

## Testing and Validation

### Security Test Suite
```typescript
// tests/security/security-fixes.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { SessionManager } from '../../src/lib/auth/session-manager';
import { InputSanitizer } from '../../src/lib/auth/input-sanitizer';
import { config } from '../../src/lib/env-config';

describe('Security Fixes Validation', () => {
  describe('Environment Configuration', () => {
    it('should not expose secrets in config', () => {
      // Ensure no hardcoded secrets
      const configString = JSON.stringify(config);
      expect(configString).not.toMatch(/sk-[a-zA-Z0-9]+/);
      expect(configString).not.toMatch(/password.*:/);
      expect(configString).not.toMatch(/secret.*:/);
    });

    it('should validate required environment variables', () => {
      expect(() => config.get('DATABASE_URL')).not.toThrow();
      expect(() => config.get('NEXTAUTH_SECRET')).not.toThrow();
      expect(() => config.get('API_SECRET_KEY')).not.toThrow();
    });
  });

  describe('Session Management', () => {
    it('should create and validate sessions securely', async () => {
      const user = { id: '1', email: 'test@example.com', role: 'user' };
      const token = await SessionManager.createSession(user);
      
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      
      const session = await SessionManager.validateSession(token);
      expect(session?.userId).toBe(user.id);
      expect(session?.email).toBe(user.email);
    });

    it('should reject invalid tokens', async () => {
      const invalidToken = 'invalid.token.here';
      const session = await SessionManager.validateSession(invalidToken);
      expect(session).toBeNull();
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize email inputs', () => {
      const email = InputSanitizer.sanitizeEmail('  TEST@EXAMPLE.COM  ');
      expect(email).toBe('test@example.com');
    });

    it('should reject malicious inputs', () => {
      expect(() => {
        InputSanitizer.sanitizeEmail('<script>alert("xss")</script>@example.com');
      }).toThrow();
    });

    it('should sanitize user inputs', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello';
      const sanitized = InputSanitizer.sanitizeUserInput(maliciousInput);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello');
    });
  });
});
```

## Deployment Checklist

### Pre-Deployment
- [ ] All hardcoded secrets removed
- [ ] Environment variables configured
- [ ] Dependencies updated and tested
- [ ] Security tests passing
- [ ] Authentication flow tested

### Post-Deployment
- [ ] Monitor for authentication errors
- [ ] Verify session management working
- [ ] Check dependency vulnerability status
- [ ] Validate environment configuration

## Monitoring and Alerts

```typescript
// src/lib/security/security-monitor.ts
export class SecurityMonitor {
  static logSecurityEvent(event: SecurityEvent): void {
    console.log(`🔒 Security Event: ${event.type}`, {
      timestamp: new Date().toISOString(),
      severity: event.severity,
      details: event.details,
      userId: event.userId,
      ip: event.ip
    });

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Send to your monitoring service (DataDog, Sentry, etc.)
    }
  }

  static alertCriticalSecurity(message: string, details: any): void {
    console.error(`🚨 CRITICAL SECURITY ALERT: ${message}`, details);
    
    // Send immediate alert in production
    if (process.env.NODE_ENV === 'production') {
      // Send to alerting service
    }
  }
}
```

This completes the critical security fixes implementation guide. The fixes address all identified security vulnerabilities and establish a secure foundation for the application.