"""Role-based permissions. Use with IsAuthenticated (all APIs require auth by default)."""
from rest_framework import permissions


class IsVendor(permissions.BasePermission):
    message = "Vendor role required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "VENDOR"
        )


class IsCustomer(permissions.BasePermission):
    message = "Customer role required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "CUSTOMER"
        )
