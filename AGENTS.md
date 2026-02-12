# AGENTS.md — Project Rules & Guidelines

This document provides a quick reference to the mandatory rules and guidelines for this project.
For the complete, authoritative rules, see `.cursorrules`.

---

## 🎯 Project Type
**API-First Django Application**

- All client apps (web, mobile, desktop) consume JSON APIs only.
- Django renders NO frontend templates (except `/admin/`).
- PERFORMANCE is a top priority at all times.

---

## 📋 Quick Reference

### Routing
| Rule | Details |
|------|---------|
| Root URL | "/" returns JSON only (health/info) |
| API Paths | All APIs live under "/api/" with trailing slashes |
| Admin Only | Only "/admin/" may use Django templates |
| No Redirect | API endpoints must not redirect |

### Authentication & Security
| Requirement | Details |
|-------------|---------|
| Method | JWT via django-rest-framework-simplejwt |
| Storage | HttpOnly cookies ONLY (never localStorage) |
| Headers | Use X-CSRFToken header; do NOT use Authorization headers |
| CSRF | Always enabled; use @ensure_csrf_cookie on endpoints that need it |

### Permissions
| Status Code | Meaning |
|-------------|---------|
| 401 | Not authenticated |
| 403 | Authenticated but not allowed |
| Default | All APIs require authentication |
| Public Endpoints | Must explicitly use `AllowAny` permission class |

### Response Format
- JSON only
- No HTML responses
- No template rendering
- Use DRF serializers for validation
- Proper HTTP status codes required

---

## ⚡ Performance (Non-Negotiable)

**EVERY API change must consider performance.**

- Assume production-scale data
- Avoid N+1 queries (use `select_related()` / `prefetch_related()`)
- Optimize querysets BEFORE serialization
- Pagination REQUIRED for list endpoints
- Do NOT return unused fields
- Use queryset filtering, not Python-level filtering
- Cache read-heavy endpoints
- Any performance regression = BUG

---

## 📚 Database
- No raw SQL unless absolutely required
- Index frequently filtered/joined fields
- Avoid `.all()` without pagination
- Always assume high data volume

---

## 📖 API Inventory (CRITICAL)

**Single Source of Truth:** `docs/api_endpoints.md`

### Rules
- EVERY API change MUST update this file
- Includes: create, modify, delete, rename, permission changes
- Update must occur in the SAME task

### Each Entry Must Include
- HTTP method(s)
- Full path with trailing slash
- View/ViewSet name
- Permission classes
- Role scope (any / auth-any / customer / vendor)
- Short description
- Special notes (CSRF, cookies, ownership rules)

---

## ❌ What NOT to Do
- Do NOT reintroduce template-based frontend routes
- Do NOT disable CSRF
- Do NOT store JWTs in localStorage/sessionStorage
- Do NOT add APIs outside "/api/"
- Do NOT guess endpoints — inspect `urls.py`
- Do NOT sacrifice performance for quick fixes

---

## ✅ Task Completion Checklist

Before marking tasks complete, verify:
- [ ] APIs work as intended
- [ ] Permissions & roles are correct
- [ ] Performance rules are respected
- [ ] `docs/api_endpoints.md` is updated
- [ ] `.cursorrules` requirements are met

---

## 🔗 Related Files
- `.cursorrules` — Authoritative rules (READ FIRST)
- `docs/api_endpoints.md` — API inventory
- `urls.py` — Actual registered endpoints