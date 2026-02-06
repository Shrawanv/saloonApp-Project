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


class CustomerProfileUpdateSerializer(serializers.Serializer):
    """PATCH /api/customer/profile/. Customer can update only these fields."""
    first_name = serializers.CharField(required=False, max_length=150, allow_blank=True)
    last_name = serializers.CharField(required=False, max_length=150, allow_blank=True)
    mobile = serializers.CharField(required=False, max_length=15)
    pincode = serializers.CharField(required=False, max_length=10)


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


class VendorSalonCreateUpdateSerializer(serializers.Serializer):
    """POST/PATCH /api/vendor/salons/. Validates body; owner set in view."""
    name = serializers.CharField(required=True, max_length=255)
    mobile = serializers.CharField(required=True, max_length=15)
    pincode = serializers.CharField(required=True, max_length=10)
    opening_time = serializers.TimeField(required=True)
    closing_time = serializers.TimeField(required=True)
    break_start_time = serializers.TimeField(required=False, allow_null=True)
    break_end_time = serializers.TimeField(required=False, allow_null=True)
    slot_duration = serializers.IntegerField(required=False, default=60, min_value=1)
    max_capacity_per_slot = serializers.IntegerField(required=False, default=1, min_value=1)
    is_active = serializers.BooleanField(required=False, default=True)


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ("id", "salon", "name", "price", "duration", "is_active")
        read_only_fields = ("id", "salon")


class VendorServiceCreateSerializer(serializers.Serializer):
    """POST /api/vendor/services/. Validates body; salon ownership checked in view."""
    salon_id = serializers.IntegerField(required=True)
    name = serializers.CharField(required=True, max_length=100)
    price = serializers.DecimalField(
        required=True,
        max_digits=8,
        decimal_places=2,
        min_value=0,
    )
    duration = serializers.IntegerField(required=True, min_value=1)
    is_active = serializers.BooleanField(default=True, required=False)


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

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(required=True, max_length=150)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, min_length=6)
    password_confirm = serializers.CharField(required=True, write_only=True, min_length=6)
    first_name = serializers.CharField(required=False, max_length=150, allow_blank=True)
    last_name = serializers.CharField(required=False, max_length=150, allow_blank=True)
    mobile = serializers.CharField(required=True, max_length=15)
    pincode = serializers.CharField(required=True, max_length=10)
    role = serializers.ChoiceField(choices=("CUSTOMER", "VENDOR"), required=True)

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        if User.objects.filter(username=attrs["username"]).exists():
            raise serializers.ValidationError({"username": "This username is already taken."})
        if User.objects.filter(email=attrs["email"]).exists():
            raise serializers.ValidationError({"email": "This email is already registered."})
        return attrs


class BookAppointmentSerializer(serializers.Serializer):
    """POST /api/bookings/. Multi-service: service_ids required (non-empty list)."""
    salon_id = serializers.IntegerField(required=True)
    service_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
        required=True,
    )
    appointment_date = serializers.DateField(required=True)
    slot_start = serializers.TimeField(required=True)

    def validate(self, attrs):
        salon_id = attrs["salon_id"]
        service_ids = attrs["service_ids"]
        valid_ids = set(
            Service.objects.filter(
                id__in=service_ids,
                salon_id=salon_id,
                is_active=True,
            ).values_list("id", flat=True)
        )
        if valid_ids != set(service_ids) or len(valid_ids) != len(service_ids):
            raise serializers.ValidationError(
                {"service_ids": "All services must exist and belong to the given salon."}
            )
        return attrs
