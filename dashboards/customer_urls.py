from django.urls import path
from .views import customer_dashboard, customer_slots_api
from bookings.views import customer_book_services, customer_book_datetime

urlpatterns = [
    path("", customer_dashboard, name="customer-dashboard"),
    path("book/", customer_book_services, name="customer_book"),
    path("book/date-time/", customer_book_datetime, name="customer_book_datetime"),
    path("slots/", customer_slots_api, name="customer-slots-api"),
]
