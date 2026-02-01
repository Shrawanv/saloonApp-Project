from datetime import date, datetime
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required

from salons.models import Salon
from services.models import Service
from services.slot_utils import get_slot_availability
from bookings.services import book_appointment

# Session keys for two-step booking
SESSION_SALON_ID = "booking_salon_id"
SESSION_SERVICE_IDS = "booking_service_ids"


@login_required
def customer_book_services(request):
    """
    Step 1: Select salon (searchable) and services. Salon can be pre-selected via
    ?salon_id= (e.g. from QR scan). Store in session and redirect to date/time.
    """
    salons = Salon.objects.filter(is_active=True).order_by("name")
    salon_id_param = request.GET.get("salon_id")
    salon = None
    if salon_id_param:
        try:
            sid = int(salon_id_param)
            salon = get_object_or_404(Salon, id=sid, is_active=True)
        except (ValueError, TypeError):
            pass
    if not salon and salons.exists():
        salon = salons.first()

    services = (
        Service.objects.filter(salon=salon, is_active=True).order_by("name")
        if salon
        else []
    )

    if request.method == "POST":
        posted_salon_id = request.POST.get("salon_id")
        if not posted_salon_id:
            messages.error(request, "Please select a salon.")
            return render(request, "customer/book_services.html", {
                "salons": salons,
                "salon": salon,
                "services": services,
            })
        try:
            sid = int(posted_salon_id)
            salon = get_object_or_404(Salon, id=sid, is_active=True)
        except (ValueError, TypeError):
            messages.error(request, "Invalid salon selected.")
            return render(request, "customer/book_services.html", {
                "salons": salons,
                "salon": salon,
                "services": Service.objects.filter(salon=salon, is_active=True).order_by("name") if salon else [],
            })

        service_ids = request.POST.getlist("service_ids")
        if not service_ids:
            messages.error(request, "Please select at least one service.")
            return render(request, "customer/book_services.html", {
                "salons": salons,
                "salon": salon,
                "services": services,
            })

        try:
            ids = [int(sid) for sid in service_ids]
        except ValueError:
            messages.error(request, "Invalid service selection.")
            return render(request, "customer/book_services.html", {
                "salons": salons,
                "salon": salon,
                "services": services,
            })

        request.session[SESSION_SALON_ID] = salon.id
        request.session[SESSION_SERVICE_IDS] = ids
        return redirect("customer_book_datetime")

    return render(request, "customer/book_services.html", {
        "salons": salons,
        "salon": salon,
        "services": services,
    })


@login_required
def customer_book_datetime(request):
    """
    Step 2: Select date and slot (slots are generated from session service duration).
    """
    salon_id = request.session.get(SESSION_SALON_ID)
    service_ids = request.session.get(SESSION_SERVICE_IDS)

    if not salon_id or not service_ids:
        messages.warning(request, "Please select services first.")
        return redirect("customer_book")

    salon = get_object_or_404(Salon, id=salon_id, is_active=True)
    services = list(
        Service.objects.filter(
            id__in=service_ids,
            salon=salon,
            is_active=True,
        )
    )
    if len(services) != len(service_ids):
        messages.error(request, "Selected services are no longer valid. Please choose again.")
        request.session.pop(SESSION_SALON_ID, None)
        request.session.pop(SESSION_SERVICE_IDS, None)
        return redirect("customer_book")

    total_duration = sum(s.duration for s in services)
    total_amount = sum(s.price for s in services)
    errors = []
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
                if appointment_date < date.today():
                    errors.append("Cannot book in the past. Please select today or a future date.")
            except ValueError:
                errors.append("Invalid date format")

        slot_start_str = request.POST.get("slot_start")
        if not slot_start_str:
            errors.append("Please select a slot")

        if not errors:
            try:
                slot_start = datetime.strptime(slot_start_str, "%H:%M").time()
                book_appointment(
                    user=request.user,
                    salon=salon,
                    appointment_date=appointment_date,
                    slot_start=slot_start,
                    service_ids=service_ids,
                )
                request.session.pop(SESSION_SALON_ID, None)
                request.session.pop(SESSION_SERVICE_IDS, None)
                messages.success(request, "Appointment booked successfully.")
                return redirect("customer-dashboard")
            except (ValueError, Exception) as e:
                errors.append(str(e))

    slots = get_slot_availability(
        salon, appointment_date, duration_minutes=total_duration
    )

    return render(request, "customer/book_datetime.html", {
        "salon": salon,
        "services": services,
        "total_duration": total_duration,
        "total_amount": total_amount,
        "date": appointment_date,
        "min_booking_date": date.today(),
        "slots": slots,
        "errors": errors,
    })
