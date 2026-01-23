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
        related_name='appointments',
        limit_choices_to={'role': 'USER'}
    )

    salon = models.ForeignKey(
        Salon,
        on_delete=models.CASCADE
    )
    services = models.ManyToManyField(Service)
    appointment_date = models.DateField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='BOOKED'
    )

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} | {self.salon} | {self.appointment_date}"
    
    def calculate_total_amount(self):
        return sum(service.price for service in self.services.all())

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.total_amount = self.calculate_total_amount()
        super().save(update_fields=['total_amount'])
   

class LiveQueue(models.Model):
    STATUS_CHOICES = [
        ('WAITING', 'Waiting'),
        ('WIP', 'Work In Progress'),
        ('DONE', 'Done'),
    ]

    salon = models.ForeignKey(
        Salon,
        on_delete=models.CASCADE,
        related_name='live_queue'
    )
    customer_name = models.CharField(max_length=100)
    mobile = models.CharField(max_length=15)
    services = models.ManyToManyField(Service)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='WAITING'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.customer_name} - {self.salon.name}"
