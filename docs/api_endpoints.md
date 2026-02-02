API Endpoints Inventory
=======================

Single source of truth for all **currently-implemented** API endpoints.

Conventions:
- **Role scope**: `any`, `auth-any`, `customer`, `vendor`
- All paths are under `/api/` and include a trailing slash.

---

Auth Endpoints
--------------

Method | Path | View | Permission classes | Role scope | Description | Special notes
------ | ---- | ---- | ------------------ | ---------- | ----------- | -------------
POST | `/api/auth/login/` | `LoginView` | `AllowAny` | any | Username/password login, sets JWT access + refresh in HttpOnly cookies, returns user JSON. | No tokens in JSON; cookies only.
POST | `/api/auth/refresh/` | `RefreshView` | `AllowAny` | any | Reads refresh token from HttpOnly cookie and issues new access token cookie. | No tokens in JSON; requires valid `refresh_token` cookie.
POST | `/api/auth/logout/` | `LogoutView` | `AllowAny` | any | Clears JWT cookies; idempotent. | Does not require auth; safe to call even if not logged in.
GET | `/api/auth/csrf/` | `csrf_view` | (Django view, no DRF permission class) | any | Ensures CSRF cookie is set. | Uses `@require_GET` and `@ensure_csrf_cookie`; CSRF token **not** returned in JSON; cookie must appear as `csrftoken`.
GET | `/api/auth/me/` | `MeView` | `IsAuthenticated` | auth-any | Returns current authenticated user. | Requires valid `access_token` JWT in HttpOnly cookie; uses `JWTCookieAuthentication`.

---

Customer & General Browsing Endpoints
-------------------------------------

Method | Path | View | Permission classes | Role scope | Description | Special notes
------ | ---- | ---- | ------------------ | ---------- | ----------- | -------------
GET | `/api/salons/` | `SalonListAPIView` | `IsAuthenticated` | auth-any | List active salons. | Queryset filtered by `is_active=True`, ordered by name; JSON-only.
GET | `/api/services/` | `ServiceListBySalonAPIView` | `IsAuthenticated` | auth-any | List active services for a specific salon. | Requires `?salon_id=`; 400 if missing; 404 if salon not found or inactive.
GET | `/api/slots/` | `SlotsAPIView` | `IsAuthenticated` | auth-any | Get available booking slots. | Requires `salon_id` and `date` (`YYYY-MM-DD`); optional `duration_minutes`; validates input and uses `get_slot_availability`.

---

Customer Booking Endpoints
--------------------------

### POST `/api/bookings/` — Create appointment (multi-service)

| Item | Detail |
|------|--------|
| **Method** | POST |
| **Path** | `/api/bookings/` (trailing slash required) |
| **View** | `BookAppointmentAPIView` |
| **Permission classes** | `IsAuthenticated`, `IsCustomer` |
| **Role scope** | customer only (401 unauthenticated, 403 if authenticated but not customer) |
| **Response** | JSON only; 201 on success with `AppointmentSerializer` data; no redirects, no HTML. |

**Request body (required):**

```json
{
  "salon_id": 1,
  "service_ids": [1, 2, 3],
  "appointment_date": "YYYY-MM-DD",
  "slot_start": "HH:MM"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `salon_id` | number | Yes | Must be an active salon. |
| `service_ids` | array of numbers | Yes | Non-empty list; each id must exist, be active, and belong to the given `salon_id`. Serializer and service layer both enforce this. |
| `appointment_date` | string | Yes | Format `YYYY-MM-DD`; must not be in the past. |
| `slot_start` | string | Yes | Format `HH:MM`; must be an available slot for the **total duration** of all selected services. |

**Deprecated / must NOT be used:** `service_id` (single), `date`, `start_time`.

**Validation rules:**

- `service_ids` is required and must be a non-empty list of integers.
- All services in `service_ids` must belong to the salon identified by `salon_id` (validated in serializer and in `book_appointment` service).
- Total booking duration = sum of each service’s `duration` (minutes). Slot availability is checked for this total duration; overlapping bookings are rejected.
- Booking is created inside a transaction; slot capacity is checked atomically (existing BOOKED appointments for that salon/date are considered for overlap).
- Past dates are rejected with 400.

**Multi-service duration logic:**

- The backend sums the `duration` (minutes) of every service in `service_ids`.
- Slot availability is computed for that total duration (one logical “slot” = full combined service time).
- The chosen `slot_start` must be available for that duration; if the slot is full or invalid, the request returns 400.

**Performance:** Service resolution and slot check use single queries; no N+1. Appointment creation uses `transaction.atomic` for slot locking.

---

Method | Path | View | Permission classes | Role scope | Description | Special notes
------ | ---- | ---- | ------------------ | ---------- | ----------- | -------------
GET | `/api/bookings/mine/` | `MyAppointmentsAPIView` | `IsAuthenticated`, `IsCustomer` | customer | List current customer’s appointments. | Uses `select_related("salon")` and `prefetch_related("services")`; ordered by most recent.

---

Vendor Service Management Endpoints
-----------------------------------

Method | Path | View | Permission classes | Role scope | Description | Special notes
------ | ---- | ---- | ------------------ | ---------- | ----------- | -------------
GET | `/api/vendor/services/` | `VendorServiceListCreateAPIView` | `IsAuthenticated`, `IsVendor` | vendor | List vendor’s own services. | Optional `?salon=` filter; only services for salons owned by the vendor.
POST | `/api/vendor/services/` | `VendorServiceListCreateAPIView` | `IsAuthenticated`, `IsVendor` | vendor | Create a new service for a vendor-owned salon. | Requires `salon_id` in body; validates ownership and data with `ServiceSerializer`; sets `is_active=True`.
GET | `/api/vendor/services/<int:pk>/` | `VendorServiceDetailAPIView` | `IsAuthenticated`, `IsVendor` | vendor | Retrieve details of a single vendor-owned service. | 404 if service not found or not owned by vendor.
PATCH | `/api/vendor/services/<int:pk>/` | `VendorServiceDetailAPIView` | `IsAuthenticated`, `IsVendor` | vendor | Partially update a vendor-owned service. | Uses `ServiceSerializer(partial=True)`; only for services owned by the vendor.
DELETE | `/api/vendor/services/<int:pk>/` | `VendorServiceDetailAPIView` | `IsAuthenticated`, `IsVendor` | vendor | Delete a vendor-owned service. | Hard delete; 204 on success; 404 if not owned or missing.

---

CSRF + Tunnel Testing Notes
----------------------------

- **CSRF protection is always enabled.** No `csrf_exempt`; no middleware disabled.
- **JWT remains cookie-only (HttpOnly).** No Authorization header for API auth.
- **Trusted origins** (for tunnel and local testing) are set in `saloonApp.settings.security` via `CSRF_TRUSTED_ORIGINS`:
  - Default list: `http://localhost:8000`, `http://127.0.0.1:8000`, `https://*.trycloudflare.com`, `https://*.ngrok-free.dev`.
  - Override via env: `CSRF_TRUSTED_ORIGINS` as a comma-separated list (e.g. `https://my-subdomain.trycloudflare.com,http://localhost:8000`). Parsed to a Python list (strip, skip empty).
- **Flow for Cloudflare tunnel / mobile:**
  1. GET `/api/auth/csrf/` from the tunnel origin (e.g. `https://xxx.trycloudflare.com`) so Django sets the `csrftoken` cookie and the response is same-origin for that domain.
  2. For every state-changing (POST/PATCH/DELETE) request, send the `X-CSRFToken` header with the value of the `csrftoken` cookie.
  3. Send cookies with requests (same domain as the API base URL when using the tunnel).
- **Verification:** POST requests from the Cloudflare domain must succeed when `X-CSRFToken` is set from the cookie; no security loosening (no exemptions, no disabling CSRF).

