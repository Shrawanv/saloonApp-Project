"""DRF serializers for API. Validation only; no UI assumptions."""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from salons.models import Salon
from services.models import Service
from bookings.models import Appointment

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Minimal user info (no password)."""

    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "role", "mobile", "pincode")
        read_only_fields = fields


class SalonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Salon
        fields = (
            "id",
            "name",
            "mobile",
            "pincode",
            "opening_time",
            "closing_time",
            "break_start_time",
            "break_end_time",
            "slot_duration",
            "max_capacity_per_slot",
            "is_active",
        )
        read_only_fields = fields


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ("id", "salon", "name", "price", "duration", "is_active")
        read_only_fields = ("id", "salon")


class AppointmentSerializer(serializers.ModelSerializer):
    salon_name = serializers.CharField(source="salon.name", read_only=True)
    services_detail = ServiceSerializer(source="services", many=True, read_only=True)

    class Meta:
        model = Appointment
        fields = (
            "id",
            "salon",
            "salon_name",
            "appointment_date",
            "slot_start",
            "status",
            "total_amount",
            "duration_minutes",
            "services",
            "services_detail",
            "created_at",
        )
        read_only_fields = ("id", "user", "total_amount", "duration_minutes", "created_at")


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class BookAppointmentSerializer(serializers.Serializer):
    salon_id = serializers.IntegerField(required=True)
    service_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
        required=True,
    )
    appointment_date = serializers.DateField(required=True)
    slot_start = serializers.TimeField(required=True)
