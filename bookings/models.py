from django.conf import settings
from django.db import models
from salons.models import Salon
from services.models import Service

class Appointment(models.Model):
    STATUS_CHOICES = [
        ('BOOKED', 'Booked'),
        ('CANCELLED', 'Cancelled'),
        ('COMPLETED', 'Completed'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('FAILED', 'Failed'),
    ]

    PAYMENT_MODE_CHOICES = [
        ('UNSET', 'Unset'),
        ('CASH', 'Cash'),
        ('ONLINE', 'Online'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="appointments",
        null=True,
        blank=True
    )

    guest_name = models.CharField(max_length=100, null=True, blank=True)
    guest_mobile = models.CharField(max_length=15, null=True, blank=True)

    salon = models.ForeignKey(
        Salon,
        on_delete=models.CASCADE,
        related_name="appointments"
    )

    services = models.ManyToManyField(Service)

    appointment_date = models.DateField()

    slot_start = models.TimeField() 

    checked_in_at = models.DateTimeField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="BOOKED"
    )

    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default="PENDING"
    )

    payment_mode = models.CharField(
        max_length=20,
        choices=PAYMENT_MODE_CHOICES,
        default="UNSET"
    )

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    duration_minutes = models.PositiveIntegerField(
        default=0,
        help_text="Total duration of selected services; used for slot availability.",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def calculate_total_amount(self):
        return sum(service.price for service in self.services.all())

    @classmethod
    def cancel_expired_appointments(cls, user=None, salon=None):
        """
        Auto-cancels 'BOOKED' appointments that are in the past.
        Optionally filters by user or salon.
        """
        from datetime import date
        today = date.today()
        expired = cls.objects.filter(
            appointment_date__lt=today,
            status='BOOKED'
        )
        if user:
            expired = expired.filter(user=user)
        if salon:
            expired = expired.filter(salon=salon)
        
        return expired.update(status='CANCELLED')

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.total_amount = self.calculate_total_amount()
        super().save(update_fields=["total_amount"])
