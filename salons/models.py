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
            checked_in_at__isnull=True
        ).count()

    @property
    def waiting_time(self):
        """
        Calculates estimated waiting time in minutes for a new walk-in.
        Very basic implementation: 
        1. Find all BOOKED appointments for today.
        2. Those already checked-in are 'occupying' capacity.
        3. Those not checked-in but scheduled are in the 'queue'.
        """
        from datetime import date, datetime
        today = date.today()
        now = datetime.now().time()
        
        # Appointments already checked in and (theoretically) in progress
        in_progress = self.appointments.filter(
            appointment_date=today,
            status="BOOKED",
            checked_in_at__isnull=False
        ).count()

        # How many slots are free RIGHT NOW
        free_slots = max(0, self.max_capacity_per_slot - in_progress)

        # People waiting but not yet checked in
        queued_appointments = self.appointments.filter(
            appointment_date=today,
            status="BOOKED",
            checked_in_at__isnull=True
        ).order_by('slot_start')

        if queued_appointments.count() < free_slots:
            return 0

        # Simple heuristic: average 30 mins per person in queue if all chairs are full
        # Or we can look at the average duration of their services
        total_queued_duration = sum(a.duration_minutes for a in queued_appointments)
        
        # If we have N chairs, the wait time is total_duration / N
        return round(total_queued_duration / self.max_capacity_per_slot)

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
