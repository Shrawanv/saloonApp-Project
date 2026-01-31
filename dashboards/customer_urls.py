from django.urls import path
from .views import customer_dashboard, customer_slots_api
from bookings.views import customer_book_appointment

urlpatterns = [
    path("", customer_dashboard, name="customer-dashboard"),
    path("book/", customer_book_appointment, name="customer_book"),
    path("slots/", customer_slots_api, name="customer-slots-api"),
]
