from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ADMIN = "ADMIN"
    CUSTOMER = "CUSTOMER"
    VENDOR = "VENDOR"

    ROLE_CHOICES = [
        (ADMIN, "Admin"),
        (CUSTOMER, "Customer"),
        (VENDOR, "Vendor"),
    ]

    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES
    )
    mobile = models.CharField(max_length=15)
    pincode = models.CharField(max_length=10)

    def __str__(self):
        return f"{self.username} ({self.role})"
    