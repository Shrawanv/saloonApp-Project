"""Customer-only API routes. IsAuthenticated + IsCustomer; ownership at queryset level."""
from django.urls import path
from api.views.customer import (
    CustomerProfileAPIView,
    CustomerBookingListAPIView,
    CustomerBookingDetailAPIView,
)

urlpatterns = [
    path("profile/", CustomerProfileAPIView.as_view(), name="api-customer-profile"),
    path("bookings/", CustomerBookingListAPIView.as_view(), name="api-customer-bookings"),
    path("bookings/<int:pk>/", CustomerBookingDetailAPIView.as_view(), name="api-customer-booking-detail"),
]
