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

    max_capacity_per_slot = models.PositiveIntegerField(default=1)

    is_active = models.BooleanField(default=True)
    logo = models.ImageField(upload_to="salon_logos/", null=True, blank=True)

    @property
    def average_rating(self):
        from django.db.models import Avg
        res = self.reviews.aggregate(Avg("rating"))["rating__avg"]
        return round(res, 1) if res else 0

    @property
    def reviews_count(self):
        return self.reviews.count()

    @property
    def services_count(self):
        return self.services.filter(is_active=True).count()

    @property
    def queue_length(self):
        from datetime import date
        return self.appointments.filter(
            appointment_date=date.today(),
            status="BOOKED"
        ).count()

class SalonMedia(models.Model):
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name="media")
    file = models.FileField(upload_to="salon_gallery/")
    media_type = models.CharField(max_length=10, choices=[("IMAGE", "Image"), ("VIDEO", "Video")])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.salon.name} - {self.media_type}"

class Review(models.Model):
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True)
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.salon.name} - {self.rating}* by {self.user}"
