from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User
from .forms import AdminUserCreationForm


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    add_form = AdminUserCreationForm

    model = User

    list_display = (
        "username",
        "email",
        "role",
        "is_active",
        "is_staff",
    )

    list_filter = ("role", "is_active")

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Personal Info", {"fields": ("first_name", "last_name", "email", "mobile")}),
        ("Permissions", {"fields": ("role", "is_active", "is_staff", "is_superuser")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "username",
                "first_name",
                "last_name",
                "email",
                "mobile",
                "role",
                "is_active",
                "is_staff",
            ),
        }),
    )

    search_fields = ("username", "email", "mobile")
    ordering = ("username",)
