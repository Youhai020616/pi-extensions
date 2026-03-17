---
name: api-design
description: Use when designing, building, or reviewing REST/GraphQL APIs — covers endpoint design, error handling, versioning, authentication, and documentation
---

# API Design

## Overview

Good APIs are consistent, predictable, and hard to misuse.

**Core principle:** Design the API from the consumer's perspective first, then implement.

## RESTful Design Rules

### URL Structure

```
GET    /api/v1/users          # List
POST   /api/v1/users          # Create
GET    /api/v1/users/:id      # Read
PUT    /api/v1/users/:id      # Replace
PATCH  /api/v1/users/:id      # Partial update
DELETE /api/v1/users/:id      # Delete
```

**Rules:**
- Nouns, not verbs (`/users` not `/getUsers`)
- Plural resources (`/users` not `/user`)
- Nested for relationships (`/users/:id/posts`)
- Max 2 levels deep — beyond that, use query params or top-level resource
- Lowercase, hyphen-separated (`/user-profiles` not `/userProfiles`)

### HTTP Methods & Status Codes

| Method | Success | Common Errors |
|--------|---------|---------------|
| GET | `200` | `404` not found |
| POST | `201` + Location header | `400` validation, `409` conflict |
| PUT/PATCH | `200` | `400` validation, `404` not found |
| DELETE | `204` (no body) | `404` not found |

### Error Response Format

**Always use consistent error shape:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

**Rules:**
- Machine-readable `code` (UPPER_SNAKE_CASE)
- Human-readable `message`
- `details` array for field-level errors
- Never expose stack traces in production

### Pagination

```json
GET /api/v1/users?page=2&limit=20

{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

For large datasets, prefer cursor-based:
```
GET /api/v1/events?cursor=abc123&limit=50
```

### Filtering & Sorting

```
GET /api/v1/users?status=active&role=admin     # Filter
GET /api/v1/users?sort=-created_at,name        # Sort (- = desc)
GET /api/v1/users?fields=id,name,email         # Sparse fields
```

## Versioning

**Use URL versioning** (`/api/v1/`) for simplicity:
- Explicit and visible
- Easy to route
- Easy to deprecate

**Deprecation flow:**
1. Add `Sunset` header with date
2. Return `Warning` header
3. Log usage for monitoring
4. Remove after sunset date

## Authentication

| Method | When to Use |
|--------|-------------|
| **Bearer Token (JWT)** | SPAs, mobile apps |
| **API Key** | Server-to-server, third-party integrations |
| **OAuth 2.0** | Third-party access delegation |
| **Session Cookie** | Traditional web apps |

**Security checklist:**
- [ ] HTTPS everywhere (no exceptions)
- [ ] Rate limiting per endpoint
- [ ] Input validation on all parameters
- [ ] No sensitive data in URLs (use headers/body)
- [ ] CORS configured correctly
- [ ] Auth tokens expire and refresh

## Documentation

Every API endpoint needs:

```yaml
# Example: OpenAPI / Swagger format
paths:
  /users:
    get:
      summary: List users
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [active, inactive]
      responses:
        200:
          description: Success
        401:
          description: Unauthorized
```

**Document:**
- All parameters with types and constraints
- All response codes with examples
- Authentication requirements
- Rate limits
- Breaking changes in changelog

## Checklist Before Shipping

- [ ] Consistent URL patterns across all endpoints
- [ ] Consistent error format
- [ ] Pagination on all list endpoints
- [ ] Input validation with clear error messages
- [ ] Authentication and authorization
- [ ] Rate limiting
- [ ] CORS headers
- [ ] API documentation / OpenAPI spec
- [ ] Versioning strategy decided
- [ ] No breaking changes without version bump
