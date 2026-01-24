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

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="appointments"
    )

    salon = models.ForeignKey(
        Salon,
        on_delete=models.CASCADE,
        related_name="appointments"
    )

    services = models.ManyToManyField(Service)

    appointment_date = models.DateField()

    slot_start = models.TimeField() 

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="BOOKED"
    )

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def calculate_total_amount(self):
        return sum(service.price for service in self.services.all())

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.total_amount = self.calculate_total_amount()
        super().save(update_fields=["total_amount"])
