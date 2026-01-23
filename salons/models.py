from django.db import models

class Salon(models.Model):
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="salons"
    )

    mobile = models.CharField(max_length=15)
    pincode = models.CharField(max_length=10)

    # 🔹 SLOT SYSTEM CONFIG
    opening_time = models.TimeField()
    closing_time = models.TimeField()

    break_start_time = models.TimeField(null=True, blank=True)
    break_end_time = models.TimeField(null=True, blank=True)

    slot_duration = models.PositiveIntegerField(default=60)  # minutes
    max_capacity_per_slot = models.PositiveIntegerField(default=1)

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
