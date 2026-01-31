from datetime import date, datetime
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required

from salons.models import Salon
from services.slot_utils import get_slot_availability
from bookings.services import book_appointment


@login_required
def customer_book_appointment(request):
    salon = Salon.objects.first()  # temp for testing

    errors = []

    # DEFAULT for GET
    appointment_date = date.today()

    if request.method == "POST":
        appointment_date_str = request.POST.get("appointment_date")

        if not appointment_date_str:
            errors.append("Invalid date selected")
        else:
            try:
                appointment_date = datetime.strptime(
                    appointment_date_str, "%Y-%m-%d"
                ).date()
            except ValueError:
                errors.append("Invalid date format")

        slot_start_str = request.POST.get("slot_start")

        if not slot_start_str:
            errors.append("Please select a slot")

        if not errors:
            try:
                slot_start = datetime.strptime(
                    slot_start_str, "%H:%M"
                ).time()

                book_appointment(
                    user=request.user,
                    salon=salon,
                    appointment_date=appointment_date,
                    slot_start=slot_start
                )

                messages.success(request, "Appointment booked successfully")
                return redirect("customer-dashboard")

            except Exception as e:
                errors.append(str(e))

    # SAFE: appointment_date ALWAYS exists now
    slots = get_slot_availability(salon, appointment_date)

    return render(request, "customer/book.html", {
        "salon": salon,
        "date": appointment_date,
        "slots": slots,
        "errors": errors,
    })
