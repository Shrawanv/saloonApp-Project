from django.contrib import admin
from .models import Salon

@admin.register(Salon)
class SalonAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'owner',
        'mobile',
        'pincode',
        'is_active',
    )
    list_filter = ('is_active')
    list_filter = ('plan', 'is_active')
    
