from datetime import datetime, timedelta
from bookings.models import Appointment


def generate_slots_for_date(salon, target_date):
    """
    Generate time slots for a given salon and date,
    skipping break-time slots entirely.
    """

    if not salon:
        raise ValueError("Salon must be provided")
    
    if not salon.opening_time or not salon.closing_time:
        raise ValueError("Salon must have opening and closing times defined")

    slots = []

    opening_time = salon.opening_time
    closing_time = salon.closing_time
    break_start = salon.break_start_time
    break_end = salon.break_end_time
    slot_duration = salon.slot_duration  # minutes

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
        current_end = current_start + timedelta(minutes=slot_duration)

        if current_end > closing_dt:
            break

        # Skip slots overlapping break time
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
