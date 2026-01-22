from django.urls import path
from .views import (
    vendor_dashboard,
    vendor_services,
    vendor_service_create,
    vendor_service_update,
    vendor_service_delete,
    vendor_service_toggle,
)

urlpatterns = [
    path("", vendor_dashboard, name="vendor_dashboard"),

    path("services/", vendor_services, name="vendor_services"),

    path(
        "services/create/",
        vendor_service_create,
        name="vendor_service_create"
    ),

    path(
        "services/<int:service_id>/update/",
        vendor_service_update,
        name="vendor_service_update"
    ),

    path(
        "services/<int:service_id>/delete/",
        vendor_service_delete,
        name="vendor_service_delete"
    ),

    path(
        "services/<int:service_id>/toggle/",
        vendor_service_toggle,
        name="vendor_service_toggle"
    ),
]
