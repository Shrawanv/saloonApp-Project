from django.db.models import Count
from bookings.models import Appointment

def get_available_slots(salon, date):
    from services.models import SalonSlot

    slots = SalonSlot.objects.filter(salon=salon)

    available_slots = []

    for slot in slots:
        booked_count = Appointment.objects.filter(
            salon=salon,
            slot=slot,
            appointment_date=date,
            status='Booked'
        ).count()

        remaining = slot.max_capacity - booked_count

        if remaining > 0:
            available_slots.append({
                "slot": slot,
                "booked": booked_count,
                "remaining": remaining,
            })

    return available_slots
