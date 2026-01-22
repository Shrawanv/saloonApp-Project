from django.urls import path, include
from rest_framework.routers import DefaultRouter

from api.views.slots import AvailableSlotsAPIView
from api.views.bookings import BookAppointmentAPIView
from api.views.vendor_services import VendorServiceViewSet

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


#Router for vendor APIs
router = DefaultRouter()
router.register(
    r'vendor/services',
    VendorServiceViewSet,
    basename='vendor-services'
)

urlpatterns = [
    # JWT Authentication URLs
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    #Public / Customer APIs
    path(
        'salons/<int:salon_id>/slots/',
        AvailableSlotsAPIView.as_view(),
        name='available-slots'
    ),
    path(
        'appointments/book/',
        BookAppointmentAPIView.as_view(),
        name='book-appointment'
    ),

    #Vendor APIs
    path(
        '',
        include(router.urls)
    ),
]
