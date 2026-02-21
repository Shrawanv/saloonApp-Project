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
            status="BOOKED",
            checked_in_at__isnull=False
        ).count()

    @property
    def waiting_time(self):
        """
        Calculates estimated waiting time in minutes for a new walk-in.
        Based strictly on customers physically present (checked-in).
        """
        from datetime import date
        today = date.today()
        
        # Only consider people present in the salon (checked-in)
        present_appointments = self.appointments.filter(
            appointment_date=today,
            status="BOOKED",
            checked_in_at__isnull=False
        )

        if present_appointments.count() < self.max_capacity_per_slot:
            return 0

        # Simple heuristic: average remaining time per chair
        # We use total duration of those present divided by number of chairs
        total_duration = sum(a.duration_minutes for a in present_appointments)
        
        # If we have 2 chairs and 2 people (30m each), wait is ~15-30m.
        # Total (60) / 2 = 30. This represents the average wait for a NEW person
        # if they join the end of the current physical presence.
        return round(total_duration / self.max_capacity_per_slot)

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

class BroadcastOffer(models.Model):
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name="broadcasts")
    title = models.CharField(max_length=255)
    message = models.TextField()
    offer_code = models.CharField(max_length=50, blank=True, null=True)
    discount_type = models.CharField(
        max_length=10,
        choices=[("PERCENT", "Percentage"), ("FLAT", "Flat Amount")],
        default="PERCENT",
    )
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    expiry_date = models.DateField(null=True, blank=True)
    target_audience = models.CharField(
        max_length=20,
        choices=[
            ("ALL", "All Customers"),
            ("LOYAL", "Loyal Customers Only"),
            ("NEW", "New Customers Only"),
        ],
        default="ALL",
    )
    is_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.salon.name}"
