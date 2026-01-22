from django.db import models
from salons.models import Salon

class Service(models.Model):
    salon = models.ForeignKey(
        Salon,
        on_delete=models.CASCADE,
        related_name='services'
    )
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    duration = models.PositiveIntegerField(
        help_text="Duration in minutes"
    )
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - {self.salon.name}"
    

class SalonSlot(models.Model):
    salon = models.ForeignKey(
        'salons.Salon',
        on_delete=models.CASCADE,
        related_name='slots'
    )
    start_time = models.TimeField()
    end_time = models.TimeField()

    max_capacity = models.PositiveIntegerField(
        default=1,
        help_text="Maximum appointments allowed in this slot"
    )

    def __str__(self):
        return f"{self.salon.name} | {self.start_time} - {self.end_time}"


