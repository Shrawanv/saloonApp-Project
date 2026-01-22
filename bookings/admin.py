from django.contrib import admin
from django.core.exceptions import ValidationError

from .models import Appointment, LiveQueue


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'salon',
        'appointment_date',
        'slot',
        'status',
        'total_amount',
    )

    readonly_fields = ('total_amount',)

    list_filter = ('status', 'salon')

    #Enforce slot capacity (ADMIN ONLY)
    def save_model(self, request, obj, form, change):
        qs = Appointment.objects.filter(
            slot=obj.slot,
            appointment_date=obj.appointment_date,
            status='BOOKED'
        )

        # If editing an existing appointment, exclude itself
        if obj.pk:
            qs = qs.exclude(pk=obj.pk)

        if qs.count() >= obj.slot.max_capacity:
            raise ValidationError(
                f"This slot is fully booked (max {obj.slot.max_capacity})."
            )

        super().save_model(request, obj, form, change)

    #Calculate total AFTER services are saved
    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)

        appointment = form.instance
        appointment.total_amount = sum(
            service.price for service in appointment.services.all()
        )

        appointment.save(update_fields=['total_amount'])
