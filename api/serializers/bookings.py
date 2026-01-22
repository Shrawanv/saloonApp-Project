from django.db import transaction
from rest_framework import serializers
from bookings.models import Appointment
from services.models import SalonSlot


class AppointmentCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Appointment
        fields = [
            "salon",
            "slot",
            "appointment_date",
            "services",
        ]

    def validate(self, attrs):
        user = attrs["user"]
        slot = attrs["slot"]
        date = attrs["appointment_date"]

        with transaction.atomic():
            # 🔒 Lock slot row (capacity safety)
            locked_slot = (
                SalonSlot.objects
                .select_for_update()
                .get(id=slot.id)
            )

            #Prevent duplicate booking by same user
            if Appointment.objects.filter(
                user=user,
                slot=locked_slot,
                appointment_date=date,
                status="BOOKED",
            ).exists():
                raise serializers.ValidationError(
                    "You already have a booking for this slot."
                )

            #Capacity check
            booked_count = Appointment.objects.filter(
                slot=locked_slot,
                appointment_date=date,
                status="BOOKED",
            ).count()

            if booked_count >= locked_slot.max_capacity:
                raise serializers.ValidationError(
                    f"This slot is fully booked (max {locked_slot.max_capacity})."
                )

        return attrs

    def create(self, validated_data):
        # user is coming from JWT
        validated_data["user"] = self.context["request"].user
        services = validated_data.pop("services")

        appointment = Appointment.objects.create(**validated_data)
        appointment.services.set(services)

        return appointment
