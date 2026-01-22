from django.contrib import admin
from .models import Service


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "salon", "price", "duration", "is_active")
    list_filter = ("salon", "is_active")
    search_fields = ("name",)

    # 🔒 Make everything read-only
    readonly_fields = (
        "name",
        "salon",
        "price",
        "duration",
        "is_active",
    )

    #Disable add
    def has_add_permission(self, request):
        if request.user != "ADMIN":
            return False

    #Disable edit
    def has_change_permission(self, request, obj=None):
        if request.user != "ADMIN":
            return False

    #Disable delete
    def has_delete_permission(self, request, obj=None):
        if request.user != "ADMIN":
            return False
