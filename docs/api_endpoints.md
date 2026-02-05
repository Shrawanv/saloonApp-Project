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
GET | `/api/salons/` | `SalonListAPIView` | `IsAuthenticated` | auth-any | List active salons (paginated). | Pagination: `page`, `page_size` (max 100); queryset `is_active=True`, ordered by name; JSON-only.
GET | `/api/services/` | `ServiceListBySalonAPIView` | `IsAuthenticated` | auth-any | List active services for a salon (paginated). | Requires `?salon_id=`; 400 if missing; 404 if salon not found; `select_related("salon")`; pagination: `page`, `page_size`.
GET | `/api/slots/` | `SlotsAPIView` | `IsAuthenticated` | auth-any | Get available booking slots. | Requires `salon_id` and `date` (`YYYY-MM-DD`); optional `duration_minutes`; validates input and uses `get_slot_availability`.

---

Customer CRUD APIs (`/api/customer/`)
-------------------------------------

Customer can manage **only their own** profile and bookings. Ownership enforced at queryset level (e.g. `request.user.appointments`). All require `IsAuthenticated` + `IsCustomer`; 401 if unauthenticated, 403 if not customer.

Method | Path | View | Permission classes | Role scope | Description | Special notes
------ | ---- | ---- | ------------------ | ---------- | ----------- | -------------
GET | `/api/customer/profile/` | `CustomerProfileAPIView` | `IsAuthenticated`, `IsCustomer` | customer | Read own profile. | Returns `UserSerializer` (id, username, first_name, last_name, role, mobile, pincode); no password.
PATCH | `/api/customer/profile/` | `CustomerProfileAPIView` | `IsAuthenticated`, `IsCustomer` | customer | Update own profile. | Body: `first_name`, `last_name`, `mobile`, `pincode` (all optional). Validated via `CustomerProfileUpdateSerializer`; no role/username change.
GET | `/api/customer/bookings/` | `CustomerBookingListAPIView` | `IsAuthenticated`, `IsCustomer` | customer | List own bookings (paginated). | Queryset: `request.user.appointments`; `select_related("salon")`, `prefetch_related("services")`; ordered by most recent; pagination: `page`, `page_size` (max 100).
GET | `/api/customer/bookings/<id>/` | `CustomerBookingDetailAPIView` | `IsAuthenticated`, `IsCustomer` | customer | Retrieve one own booking. | 404 if not found or not owned; JSON only.
DELETE | `/api/customer/bookings/<id>/` | `CustomerBookingDetailAPIView` | `IsAuthenticated`, `IsCustomer` | customer | Cancel own booking. | **Rules:** status must be `BOOKED`; `appointment_date` must be >= today. 400 if already cancelled/completed or past; 404 if not owned. Sets status to `CANCELLED`; 204 on success.

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
GET | `/api/bookings/mine/` | `MyAppointmentsAPIView` | `IsAuthenticated`, `IsCustomer` | customer | List current customer’s appointments (paginated). | Uses `select_related("salon")`, `prefetch_related("services")`; ordered by most recent; pagination: `page`, `page_size` (max 100).

---

Vendor Salons CRUD (`/api/vendor/salons/`)
------------------------------------------

Vendor can manage **only salons they own**. Ownership enforced via `request.user.salons` (queryset filtered by `owner=request.user`). All require `IsAuthenticated` + `IsVendor`; 401/403 otherwise. JSON only; no HTML.

Method | Path | View | Permission classes | Role scope | Description | Special notes
------ | ---- | ---- | ------------------ | ---------- | ----------- | -------------
GET | `/api/vendor/salons/` | `VendorSalonListCreateAPIView` | `IsAuthenticated`, `IsVendor` | vendor | List own salons (paginated). | Queryset: `request.user.salons.order_by("name")`; pagination: `page`, `page_size` (max 100).
POST | `/api/vendor/salons/` | `VendorSalonListCreateAPIView` | `IsAuthenticated`, `IsVendor` | vendor | Create salon (owner=request.user). | Body validated via `VendorSalonCreateUpdateSerializer`: name, mobile, pincode, opening_time, closing_time, break_start_time, break_end_time (optional), slot_duration (default 60), max_capacity_per_slot (default 1), is_active (default true). Owner set in view; creation in `transaction.atomic()`; 400 on IntegrityError.
GET | `/api/vendor/salons/<id>/` | `VendorSalonDetailAPIView` | `IsAuthenticated`, `IsVendor` | vendor | Retrieve one own salon. | 404 if not found or not owned (JSON).
PATCH | `/api/vendor/salons/<id>/` | `VendorSalonDetailAPIView` | `IsAuthenticated`, `IsVendor` | vendor | Update one own salon. | Partial update; validated via `VendorSalonCreateUpdateSerializer`; 404 if not owned.
DELETE | `/api/vendor/salons/<id>/` | `VendorSalonDetailAPIView` | `IsAuthenticated`, `IsVendor` | vendor | Delete one own salon. | 204 on success; 404 if not owned (JSON).

---

Vendor Service Management Endpoints (`/api/vendor/services/`)
-----------------------------------

### POST `/api/vendor/services/` — Create service (vendor only)

| Item | Detail |
|------|--------|
| **Method** | POST |
| **Path** | `/api/vendor/services/` (trailing slash required) |
| **View** | `VendorServiceListCreateAPIView` |
| **Permission classes** | `IsAuthenticated`, `IsVendor` |
| **Role scope** | vendor only (401 unauthenticated, 403 if authenticated but not vendor) |
| **Response** | JSON only; 201 on success with `ServiceSerializer` data; all errors return JSON with appropriate status. |

**Request body (required):**

```json
{
  "salon_id": 1,
  "name": "Haircut",
  "price": "25.00",
  "duration": 30,
  "is_active": true
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `salon_id` | number | Yes | Salon must exist. Ownership is checked after validation: salon must belong to the authenticated vendor. |
| `name` | string | Yes | Max 100 characters. |
| `price` | number/string | Yes | Decimal, max 8 digits, 2 decimal places, ≥ 0. |
| `duration` | number | Yes | Integer, duration in minutes, ≥ 1. |
| `is_active` | boolean | No | Default `true`. |

**Ownership rules:**

- The authenticated user must be a vendor (role `VENDOR`).
- The salon identified by `salon_id` must be owned by that vendor (`salon.owner_id == request.user.id`).
- If the salon does not exist: **404 Not Found** (JSON).
- If the salon exists but is not owned by the vendor: **403 Forbidden** (JSON).

**Validation rules:**

- All request validation is done via DRF serializer (`VendorServiceCreateSerializer`); no manual field extraction.
- Invalid types or missing required fields → **400 Bad Request** with serializer error payload (e.g. `{"name": ["This field is required."]}`).
- DB constraint violations (e.g. integrity errors) → **400 Bad Request** with a generic detail message; creation is wrapped in an atomic transaction.

**Error responses (all JSON):**

| Status | When | Body example |
|--------|------|--------------|
| 400 | Validation failed (missing/invalid fields) | `{"salon_id": ["This field is required."]}` or `{"price": ["A valid number is required."]}` |
| 400 | IntegrityError / duplicate or invalid DB state | `{"detail": "Invalid or duplicate data; service could not be created."}` |
| 403 | Salon exists but vendor does not own it | `{"detail": "You do not have permission to add services to this salon."}` |
| 404 | Salon not found | `{"detail": "Salon not found."}` |

**Performance:** One query to resolve salon; one insert inside `transaction.atomic()`; no N+1.

---

Method | Path | View | Permission classes | Role scope | Description | Special notes
------ | ---- | ---- | ------------------ | ---------- | ----------- | -------------
GET | `/api/vendor/services/` | `VendorServiceListCreateAPIView` | `IsAuthenticated`, `IsVendor` | vendor | List vendor’s own services (paginated). | Optional `?salon=` filter; queryset filtered by `salon__owner=request.user`; `select_related("salon")`; pagination: `page`, `page_size` (max 100).
GET | `/api/vendor/services/<int:pk>/` | `VendorServiceDetailAPIView` | `IsAuthenticated`, `IsVendor` | vendor | Retrieve details of a single vendor-owned service. | 404 if service not found or not owned by vendor (JSON).
PATCH | `/api/vendor/services/<int:pk>/` | `VendorServiceDetailAPIView` | `IsAuthenticated`, `IsVendor` | vendor | Partially update a vendor-owned service. | Uses `ServiceSerializer(partial=True)`; only for services owned by the vendor.
DELETE | `/api/vendor/services/<int:pk>/` | `VendorServiceDetailAPIView` | `IsAuthenticated`, `IsVendor` | vendor | Delete a vendor-owned service. | Hard delete; 204 on success; 404 if not owned or missing (JSON).

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

