"""
API routes. All require authentication except: login, refresh, logout, csrf.
JWT in HttpOnly cookies only; no tokens in JSON.
"""
from django.urls import path, include
from api.views.auth import LoginView, RefreshView, LogoutView, csrf_view, MeView, RegisterView
from api.views.salons import SalonListAPIView, SalonDetailAPIView
from api.views.services import ServiceListBySalonAPIView
from api.views.slots import SlotsAPIView, SlotsBySalonPathAPIView
from api.views.bookings import BookAppointmentAPIView, MyAppointmentsAPIView
from api.views.vendor_bookings import VendorAppointmentListAPIView, VendorAppointmentUpdateAPIView

urlpatterns = [
    # Public (no auth)
    path("auth/login/", LoginView.as_view(), name="api-login"),
    path("auth/register/", RegisterView.as_view(), name="api-register"),
    path("auth/refresh/", RefreshView.as_view(), name="api-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="api-logout"),
    path("auth/csrf/", csrf_view, name="api-csrf"),

    # Authenticated
    path("auth/me/", MeView.as_view(), name="api-me"),
    path("salons/", SalonListAPIView.as_view(), name="api-salon-list"),
    path("salons/<int:pk>/", SalonDetailAPIView.as_view(), name="api-salon-detail"),
    path("services/", ServiceListBySalonAPIView.as_view(), name="api-service-list"),
    path("services/salon/<int:salon_id>/", ServiceListBySalonAPIView.as_view(), name="api-service-by-salon"),
    path("slots/", SlotsAPIView.as_view(), name="api-slots"),
    path("salons/<int:salon_id>/slots/", SlotsBySalonPathAPIView.as_view(), name="api-slots-by-salon"),
    path("bookings/", BookAppointmentAPIView.as_view(), name="api-book"),
    path("bookings/mine/", MyAppointmentsAPIView.as_view(), name="api-my-appointments"),
    path("appointments/vendor/", VendorAppointmentListAPIView.as_view(), name="api-vendor-appointments"),
    path("appointments/vendor/<int:pk>/update/", VendorAppointmentUpdateAPIView.as_view(), name="api-vendor-appointment-update"),

    # Customer only (profile, bookings)
    path("customer/", include("api.urls_customer")),

    # Vendor only (salons, services)
    path("vendor/", include("api.urls_vendor")),
]
