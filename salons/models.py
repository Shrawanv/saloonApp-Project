from django.conf import settings
from django.db import models


class Salon(models.Model):
    name = models.CharField(max_length=100)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'VENDOR'},
        related_name="salons"
    )

    mobile = models.CharField(max_length=15)
    pincode = models.CharField(max_length=10)

    doj = models.DateField(auto_now_add=True)

    plan = models.CharField(max_length=50)
    plan_start = models.DateField()
    plan_expiry = models.DateField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("owner", "name")

    def __str__(self):
        return self.name
