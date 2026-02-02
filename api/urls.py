"""
API routes. All require authentication except: login, refresh, logout, csrf.
JWT in HttpOnly cookies only; no tokens in JSON.
"""
from django.urls import path, include
from api.views.auth import LoginView, RefreshView, LogoutView, csrf_view, MeView
from api.views.salons import SalonListAPIView
from api.views.services import ServiceListBySalonAPIView, VendorServiceListCreateAPIView, VendorServiceDetailAPIView
from api.views.slots import SlotsAPIView
from api.views.bookings import BookAppointmentAPIView, MyAppointmentsAPIView

urlpatterns = [
    # Public (no auth)
    path("auth/login/", LoginView.as_view(), name="api-login"),
    path("auth/refresh/", RefreshView.as_view(), name="api-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="api-logout"),
    path("auth/csrf/", csrf_view, name="api-csrf"),

    # Authenticated
    path("auth/me/", MeView.as_view(), name="api-me"),
    path("salons/", SalonListAPIView.as_view(), name="api-salon-list"),
    path("services/", ServiceListBySalonAPIView.as_view(), name="api-service-list"),
    path("slots/", SlotsAPIView.as_view(), name="api-slots"),
    path("bookings/", BookAppointmentAPIView.as_view(), name="api-book"),
    path("bookings/mine/", MyAppointmentsAPIView.as_view(), name="api-my-appointments"),

    # Vendor only
    path("vendor/services/", VendorServiceListCreateAPIView.as_view(), name="api-vendor-service-list"),
    path("vendor/services/<int:pk>/", VendorServiceDetailAPIView.as_view(), name="api-vendor-service-detail"),
]
