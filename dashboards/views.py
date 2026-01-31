from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from .decorators import vendor_required, customer_required
from services.models import Service
from django.http import JsonResponse
from datetime import datetime
from services.slot_utils import get_slot_availability
from salons.models import Salon

@login_required
@vendor_required
def vendor_dashboard(request):
    return render(request, "vendor/dashboard.html")

@login_required
@vendor_required
def vendor_services(request):
    salons = request.user.salons.filter(is_active=True)

    selected_salon_id = request.GET.get("salon")

    if selected_salon_id:
        services = Service.objects.filter(
            salon__id=selected_salon_id,
            salon__owner=request.user
        )
    else:
        services = Service.objects.filter(
            salon__owner=request.user
        )

    return render(request, "vendor/services.html", {
        "services": services,
        "salons": salons,
        "selected_salon_id": selected_salon_id, 
    })


@login_required
@vendor_required
def vendor_service_create(request):
    if request.method == "POST":
        salon_id = request.POST.get("salon_id")

        salon = get_object_or_404(
            Salon,
            id=salon_id,
            owner=request.user
        )

        Service.objects.create(
            name=request.POST.get("name"),
            price=request.POST.get("price"),
            duration=request.POST.get("duration"),
            salon=salon,
            is_active=True
        )

        return redirect("vendor_services")

@login_required
@vendor_required
def vendor_service_update(request, service_id):
    if request.method == "POST":
        service = get_object_or_404(
            Service,
            id=service_id,
            salon__owner=request.user
        )

        service.name = request.POST.get("name")
        service.price = request.POST.get("price")
        service.duration = request.POST.get("duration")

        service.save()

    return redirect("vendor_services")


@login_required
@vendor_required
def vendor_service_delete(request, service_id):
    if request.method == "POST":
        service = get_object_or_404(
            Service,
            id=service_id,
            salon__owner=request.user
        )
        service.delete()

    return redirect("vendor_services")


@login_required
@vendor_required
def vendor_service_toggle(request, service_id):
    service = get_object_or_404(
        Service,
        id=service_id,
        salon__owner=request.user
    )

    service.is_active = not service.is_active
    service.save()

    return redirect("vendor_services")

@login_required
@customer_required
def customer_dashboard(request):
    booking_url_prefix = request.build_absolute_uri("/customer/book/")
    return render(request, "customer/dashboard.html", {
        "booking_url_prefix": booking_url_prefix,
    })

@login_required
@customer_required
def customer_slots_api(request):
    salon_id = request.GET.get("salon_id")
    date_str = request.GET.get("date")
    duration_str = request.GET.get("duration_minutes")

    if not salon_id or not date_str:
        return JsonResponse({"error": "Missing parameters"}, status=400)

    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return JsonResponse({"error": "Invalid date"}, status=400)

    duration_minutes = None
    if duration_str is not None and duration_str != "":
        try:
            duration_minutes = int(duration_str)
            if duration_minutes <= 0:
                return JsonResponse({"error": "duration_minutes must be positive"}, status=400)
        except ValueError:
            return JsonResponse({"error": "Invalid duration_minutes"}, status=400)

    salon = get_object_or_404(Salon, id=salon_id, is_active=True)

    slots = get_slot_availability(salon, target_date, duration_minutes=duration_minutes)

    data = [
        {
            "start": slot["start"].strftime("%H:%M"),
            "end": slot["end"].strftime("%H:%M"),
            "remaining": slot["remaining"],
            "is_full": slot["is_full"],
        }
        for slot in slots
    ]

    return JsonResponse({"slots": data})