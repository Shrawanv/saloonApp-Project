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

Method | Path | View | Permission classes | Role scope | Description | Special notes
------ | ---- | ---- | ------------------ | ---------- | ----------- | -------------
POST | `/api/bookings/` | `BookAppointmentAPIView` | `IsAuthenticated`, `IsCustomer` | customer | Book a new appointment. | Body fields validated by `BookAppointmentSerializer`; enforces non-past dates; uses `book_appointment` service; returns `AppointmentSerializer` data.
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

