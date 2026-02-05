"""Vendor-only API routes. IsAuthenticated + IsVendor; ownership via queryset filtering."""
from django.urls import path
from api.views.vendor_salons import VendorSalonListCreateAPIView, VendorSalonDetailAPIView
from api.views.services import VendorServiceListCreateAPIView, VendorServiceDetailAPIView

urlpatterns = [
    path("salons/", VendorSalonListCreateAPIView.as_view(), name="api-vendor-salon-list"),
    path("salons/<int:pk>/", VendorSalonDetailAPIView.as_view(), name="api-vendor-salon-detail"),
    path("services/", VendorServiceListCreateAPIView.as_view(), name="api-vendor-service-list"),
    path("services/<int:pk>/", VendorServiceDetailAPIView.as_view(), name="api-vendor-service-detail"),
]
