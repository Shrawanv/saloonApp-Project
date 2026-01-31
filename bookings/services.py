from django.db import transaction
from django.core.exceptions import ValidationError
from bookings.models import Appointment
from services.models import Service
from services.slot_utils import get_slot_availability


@transaction.atomic
def book_appointment(*, user, salon, appointment_date, slot_start, service_ids=None):
    """
    Creates an appointment if slot capacity allows. Uses total duration of
    selected services for slot availability (one slot = full service duration).
    """
    service_ids = service_ids or []

    # 1. Validate and resolve services
    if not service_ids:
        raise ValidationError("At least one service is required.")

    services = list(
        Service.objects.filter(
            id__in=service_ids,
            salon=salon,
            is_active=True,
        )
    )
    if len(services) != len(service_ids):
        raise ValidationError("One or more selected services are invalid.")

    duration_minutes = sum(s.duration for s in services)

    # 2. Check slot availability for this duration
    slots = get_slot_availability(salon, appointment_date, duration_minutes=duration_minutes)

    slot = next(
        (s for s in slots if s["start"] == slot_start),
        None
    )

    if not slot:
        raise ValidationError("Invalid slot selected")

    if slot["is_full"]:
        raise ValidationError("This slot is already fully booked")

    # 3. Create appointment
    appointment = Appointment.objects.create(
        user=user,
        salon=salon,
        appointment_date=appointment_date,
        slot_start=slot_start,
        status="BOOKED",
        duration_minutes=duration_minutes,
    )

    appointment.services.set(services)

    return appointment
