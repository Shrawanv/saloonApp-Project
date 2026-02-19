"""Vendor-only API routes. IsAuthenticated + IsVendor; ownership via queryset filtering."""
from django.urls import path
from api.views.vendor_salons import VendorSalonListCreateAPIView, VendorSalonDetailAPIView
from api.views.services import VendorServiceListCreateAPIView, VendorServiceDetailAPIView, VendorServiceToggleAPIView

from api.views.media import SalonLogoUpdateAPIView, SalonMediaListCreateAPIView, SalonMediaDeleteAPIView

urlpatterns = [
    path("salons/", VendorSalonListCreateAPIView.as_view(), name="api-vendor-salon-list"),
    path("salons/<int:pk>/", VendorSalonDetailAPIView.as_view(), name="api-vendor-salon-detail"),
    path("salons/<int:pk>/logo/", SalonLogoUpdateAPIView.as_view(), name="api-vendor-salon-logo-upload"),
    path("salons/<int:pk>/gallery/", SalonMediaListCreateAPIView.as_view(), name="api-vendor-salon-gallery-list-create"),
    path("gallery/<int:pk>/", SalonMediaDeleteAPIView.as_view(), name="api-vendor-gallery-delete"),
    path("services/", VendorServiceListCreateAPIView.as_view(), name="api-vendor-service-list"),
    path("services/<int:pk>/", VendorServiceDetailAPIView.as_view(), name="api-vendor-service-detail"),
    path("services/<int:pk>/toggle/", VendorServiceToggleAPIView.as_view(), name="api-vendor-service-toggle"),
]
