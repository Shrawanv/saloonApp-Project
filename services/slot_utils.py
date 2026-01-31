from datetime import date as date_type, datetime, timedelta
from bookings.models import Appointment


def generate_slots_for_date(salon, target_date, slot_duration_minutes=None):
    """
    Generate time slots for a given salon and date, skipping break-time slots.
    Uses slot_duration_minutes if provided, else salon.slot_duration.
    """
    if not salon:
        raise ValueError("Salon must be provided")

    if not salon.opening_time or not salon.closing_time:
        raise ValueError("Salon must have opening and closing times defined")

    duration = slot_duration_minutes if slot_duration_minutes is not None else salon.slot_duration
    slots = []

    opening_time = salon.opening_time
    closing_time = salon.closing_time
    break_start = salon.break_start_time
    break_end = salon.break_end_time

    current_start = datetime.combine(target_date, opening_time)
    closing_dt = datetime.combine(target_date, closing_time)

    break_start_dt = (
        datetime.combine(target_date, break_start)
        if break_start and break_end
        else None
    )
    break_end_dt = (
        datetime.combine(target_date, break_end)
        if break_start and break_end
        else None
    )

    while True:
        current_end = current_start + timedelta(minutes=duration)

        if current_end > closing_dt:
            break

        if break_start_dt and break_end_dt:
            overlaps_break = (
                current_start < break_end_dt
                and current_end > break_start_dt
            )
            if overlaps_break:
                current_start = current_end
                continue

        slots.append({
            "start": current_start.time(),
            "end": current_end.time(),
        })

        current_start = current_end

    return slots


def _appointment_end_time(appointment, salon):
    """End time of an appointment (slot_start + duration)."""
    from datetime import datetime, timedelta
    start_dt = datetime.combine(appointment.appointment_date, appointment.slot_start)
    duration = appointment.duration_minutes or salon.slot_duration
    end_dt = start_dt + timedelta(minutes=duration)
    return end_dt.time()


def get_slot_availability(salon, target_date, duration_minutes=None, exclude_past_slots=True):
    """
    Returns only available slots for the given duration (or salon.slot_duration).
    Excludes break time and past slots when date is today. For variable duration,
    a slot is full if any existing BOOKED appointment overlaps [slot_start, slot_start + duration].
    """
    duration = duration_minutes if duration_minutes is not None else salon.slot_duration
    slots = generate_slots_for_date(salon, target_date, slot_duration_minutes=duration)
    availability = []

    # One query: all booked appointments for this salon/date
    existing = list(
        Appointment.objects.filter(
            salon=salon,
            appointment_date=target_date,
            status="BOOKED",
        ).values("slot_start", "duration_minutes")
    )

    for slot in slots:
        slot_start_dt = datetime.combine(target_date, slot["start"])
        slot_end_dt = slot_start_dt + timedelta(minutes=duration)
        slot_end = slot_end_dt.time()

        overlapping = 0
        for appt in existing:
            appt_start = appt["slot_start"]
            appt_dur = appt["duration_minutes"] or salon.slot_duration
            appt_start_dt = datetime.combine(target_date, appt_start)
            appt_end_dt = appt_start_dt + timedelta(minutes=appt_dur)
            appt_end = appt_end_dt.time()
            if appt_start < slot_end and appt_end > slot["start"]:
                overlapping += 1

        remaining = max(salon.max_capacity_per_slot - overlapping, 0)

        availability.append({
            "start": slot["start"],
            "end": slot["end"],
            "booked": overlapping,
            "remaining": remaining,
            "is_full": remaining == 0,
        })

    if exclude_past_slots and target_date == date_type.today():
        now = datetime.now().time()
        availability = [s for s in availability if s["start"] > now]

    return availability
