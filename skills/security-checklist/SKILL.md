---
name: security-checklist
description: Use when reviewing code for security issues, handling secrets, setting up authentication, auditing dependencies, or before deploying to production
---

# Security Checklist

## Overview

Security is not a feature — it's a constraint on every feature.

**Core principle:** Assume breach. Minimize blast radius. Verify everything.

## OWASP Top 10 Quick Reference

| # | Risk | Prevention |
|---|------|-----------|
| 1 | **Broken Access Control** | Deny by default, validate on server side, RBAC |
| 2 | **Cryptographic Failures** | HTTPS everywhere, strong hashing (bcrypt/argon2), no custom crypto |
| 3 | **Injection** | Parameterized queries, input validation, escape output |
| 4 | **Insecure Design** | Threat modeling, principle of least privilege |
| 5 | **Security Misconfiguration** | Hardened defaults, remove unused features, update deps |
| 6 | **Vulnerable Components** | `npm audit`, `pip audit`, Dependabot, pin versions |
| 7 | **Auth Failures** | MFA, rate limiting, secure session management |
| 8 | **Data Integrity Failures** | Verify signatures, use trusted CI/CD, SRI for CDN |
| 9 | **Logging Failures** | Log auth events, monitor anomalies, don't log secrets |
| 10 | **SSRF** | Allowlist URLs, disable redirects, network segmentation |

## Secrets Management

### Rules

```
NEVER:
  - Hardcode secrets in source code
  - Commit .env files to git
  - Log secrets or tokens
  - Pass secrets via URL parameters
  - Store secrets in localStorage

ALWAYS:
  - Use environment variables
  - Use secret managers (Vault, AWS Secrets Manager, etc.)
  - Rotate secrets regularly
  - Use different secrets per environment
  - Add .env to .gitignore BEFORE first commit
```

### .gitignore (Security Essentials)

```
.env
.env.*
*.pem
*.key
*.p12
*.pfx
credentials.json
service-account.json
```

### Detect Leaked Secrets

```bash
# Scan git history for secrets
npx secretlint "**/*"
# or
trufflehog filesystem .
# or
gitleaks detect
```

## Input Validation

```typescript
// ✅ Validate and sanitize all input
import { z } from 'zod';

const UserInput = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100).trim(),
  age: z.number().int().min(0).max(150),
});

// ❌ Never trust raw input
app.post('/users', (req, res) => {
  const data = UserInput.parse(req.body); // throws on invalid
});
```

**SQL Injection Prevention:**
```typescript
// ✅ Parameterized queries
db.query('SELECT * FROM users WHERE id = $1', [userId]);

// ❌ NEVER string concatenation
db.query(`SELECT * FROM users WHERE id = ${userId}`);
```

## Authentication & Authorization

### Password Storage

```typescript
// ✅ bcrypt with cost factor ≥ 12
import bcrypt from 'bcrypt';
const hash = await bcrypt.hash(password, 12);
const match = await bcrypt.compare(input, hash);

// ❌ NEVER: MD5, SHA1, SHA256 without salt, plaintext
```

### JWT Best Practices

| Setting | Value |
|---------|-------|
| Algorithm | `RS256` or `ES256` (not `HS256` for public APIs) |
| Expiry | Access: 15min, Refresh: 7 days |
| Storage | HttpOnly + Secure + SameSite cookie |
| Validation | Verify signature, expiry, issuer, audience |

### Rate Limiting

```typescript
// Apply to auth endpoints
rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                     // 5 attempts
  message: 'Too many attempts, try again later'
});
```

## HTTP Security Headers

```typescript
// Use helmet.js or set manually
{
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}
```

## Dependency Audit

```bash
# Node.js
npm audit
npm audit fix

# Python
pip audit
safety check

# Check for outdated deps
npm outdated
pip list --outdated
```

**Automate with:**
- GitHub Dependabot
- Snyk
- Socket.dev

## Pre-Deployment Security Review

- [ ] No secrets in code or git history
- [ ] All inputs validated and sanitized
- [ ] SQL queries parameterized
- [ ] Authentication on all protected routes
- [ ] Authorization checks (not just auth)
- [ ] HTTPS enforced
- [ ] Security headers set
- [ ] Rate limiting on auth/sensitive endpoints
- [ ] Dependencies audited (`npm audit`)
- [ ] Error messages don't leak internals
- [ ] Logging captures auth events (not secrets)
- [ ] CORS configured (not `*` in production)
- [ ] File uploads validated (type, size, content)
- [ ] Admin panels protected and not exposed
