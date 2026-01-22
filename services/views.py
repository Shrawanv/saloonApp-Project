from django.shortcuts import render, redirect
from dashboards.decorators import vendor_required
from .models import Service
from django.contrib.auth.decorators import login_required

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
def service_create(request):
    if request.method == "POST":
        Service.objects.create(
            vendor=request.user,
            name=request.POST.get("name"),
            duration_minutes=request.POST.get("duration"),
            price=request.POST.get("price"),
        )
        return redirect("/vendor/services/")

    return render(request, "vendor/services/create.html")
