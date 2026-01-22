from django.urls import path
from .views import service_list, service_create

urlpatterns = [
    path("", service_list),
    path("create/", service_create),
]
