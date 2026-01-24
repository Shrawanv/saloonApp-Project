from django.db import transaction
from django.core.exceptions import ValidationError
from bookings.models import Appointment
from services.slot_utils import get_slot_availability


@transaction.atomic
def book_appointment(*, user, salon, appointment_date, slot_start):
    """
    Creates an appointment if slot capacity allows.
    """

    # 1. Check slot availability
    slots = get_slot_availability(salon, appointment_date)

    slot = next(
        (s for s in slots if s["start"] == slot_start),
        None
    )

    if not slot:
        raise ValidationError("Invalid slot selected")

    if slot["is_full"]:
        raise ValidationError("This slot is already fully booked")

    # 2. Create appointment
    appointment = Appointment.objects.create(
        user=user,
        salon=salon,
        appointment_date=appointment_date,
        slot_start=slot_start,
        status="BOOKED",
    )

    return appointment
