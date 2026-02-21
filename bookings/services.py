from django.db import transaction
from django.core.exceptions import ValidationError
from bookings.models import Appointment
from services.models import Service
from services.slot_utils import get_slot_availability


def is_slot_available(*, salon, appointment_date, slot_start, duration_minutes, exclude_appointment_id=None):
    """
    Checks if a specific slot is available for a salon at a given date/time.
    """
    from datetime import time
    if isinstance(slot_start, str):
        from datetime import datetime
        slot_start = datetime.strptime(slot_start, "%H:%M:%S").time()

    slots = get_slot_availability(
        salon, 
        appointment_date, 
        duration_minutes=duration_minutes, 
        exclude_appointment_id=exclude_appointment_id
    )
    
    # Find matching slot
    slot = next((s for s in slots if s["start"] == slot_start), None)
    return slot is not None and not slot["is_full"]
def book_appointment(*, user=None, salon, appointment_date, slot_start, service_ids=None, guest_name=None, guest_mobile=None, coupon_code=None):
    """
    Creates an appointment if slot capacity allows. Uses total duration of
    selected services for slot availability (one slot = full service duration).
    """
    from salons.models import BroadcastOffer
    from datetime import date
    
    service_ids = service_ids or []

    # 1. Validate and resolve services
    if not service_ids:
        raise ValidationError("At least one service is required.")

    if not user and (not guest_name or not guest_mobile):
        raise ValidationError("User or Guest details (name & mobile) are required.")

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

    # 2. Handle Coupon
    discount_amount = 0
    if coupon_code:
        try:
            offer = BroadcastOffer.objects.get(
                salon=salon,
                offer_code__iexact=coupon_code,
                is_sent=True
            )
            # Expiry check
            if offer.expiry_date and offer.expiry_date < date.today():
                raise ValidationError("Coupon has expired.")
            
            # Audience check
            if offer.target_audience == "NEW":
                if Appointment.objects.filter(user=user, salon=salon).exclude(status="CANCELLED").exists():
                    raise ValidationError("Coupon is only for new customers.")
            elif offer.target_audience == "LOYAL":
                count = Appointment.objects.filter(user=user, salon=salon, status="COMPLETED").count()
                if count < 3:
                    raise ValidationError("Coupon is for loyal customers only.")

            # Calculate discount
            total_before = sum(s.price for s in services)
            if offer.discount_type == "PERCENT":
                discount_amount = (total_before * offer.discount_value) / 100
            else:
                discount_amount = offer.discount_value
            
            # Cap discount at total
            discount_amount = min(discount_amount, total_before)
            
        except BroadcastOffer.DoesNotExist:
            raise ValidationError("Invalid coupon code.")

    # 3. Check slot availability for this duration
    slots = get_slot_availability(salon, appointment_date, duration_minutes=duration_minutes)

    slot = next(
        (s for s in slots if s["start"] == slot_start),
        None
    )

    if not slot:
        raise ValidationError("Invalid slot selected")

    if slot["is_full"]:
        raise ValidationError("This slot is already fully booked")

    # 4. Create appointment
    appointment = Appointment.objects.create(
        user=user,
        guest_name=guest_name,
        guest_mobile=guest_mobile,
        salon=salon,
        appointment_date=appointment_date,
        slot_start=slot_start,
        status="BOOKED",
        duration_minutes=duration_minutes,
        coupon_code=coupon_code,
        discount_amount=discount_amount,
    )

    appointment.services.set(services)

    return appointment
