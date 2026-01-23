from django.contrib import admin
from django.core.exceptions import ValidationError

from .models import Appointment, LiveQueue


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'salon',
        'appointment_date',
        'status',
    )

    readonly_fields = ('total_amount',)

    list_filter = ('status', 'salon')

    #Calculate total AFTER services are saved
    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)

        appointment = form.instance
        appointment.total_amount = sum(
            service.price for service in appointment.services.all()
        )

        appointment.save(update_fields=['total_amount'])
