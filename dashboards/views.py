from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from .decorators import vendor_required, customer_required
from services.models import Service, Salon


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
    return render(request, "customer/dashboard.html")