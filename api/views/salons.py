"""Salon list (authenticated). Pagination required for list."""
from datetime import date
from django.shortcuts import get_object_or_404

from datetime import date
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination

from salons.models import Salon
from bookings.models import Appointment
from api.serializers import SalonSerializer, AppointmentSerializer


class SalonListPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class SalonListAPIView(APIView):
    """GET: list active salons (paginated)."""
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Salon.objects.filter(is_active=True).order_by("name")
        paginator = SalonListPagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            ser = SalonSerializer(page, many=True)
            return paginator.get_paginated_response(ser.data)
        ser = SalonSerializer(qs, many=True)
        return Response(ser.data, status=status.HTTP_200_OK)


class SalonDetailAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            salon = Salon.objects.get(id=int(pk), is_active=True)
        except (ValueError, Salon.DoesNotExist):
            return Response({"detail": "Salon not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(SalonSerializer(salon).data, status=status.HTTP_200_OK)


class LiveQueueAPIView(APIView):
    """
    GET: List current day's booked customers with gated visibility.
    - Vendor (Owner): Full details.
    - Customer (Registered + Checked-in): Full queue (anonymized names).
    - Other/Guest: Only their own position (if identified) or basic stats.
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        salon = get_object_or_404(Salon, id=pk, is_active=True)
        today = date.today()
        
        # 1. Get all booked appointments for today
        all_booked = Appointment.objects.filter(
            salon=salon,
            appointment_date=today,
            status="BOOKED"
        ).order_by("slot_start")

        # 2. Identify if requestor is the owner
        is_owner = request.user.is_authenticated and salon.owner == request.user

        # 3. Identify if requestor has a checked-in booking
        is_checked_in = False
        user_appointment = None
        
        if request.user.is_authenticated:
            user_appointment = all_booked.filter(user=request.user).first()
            if user_appointment and user_appointment.checked_in_at:
                is_checked_in = True
        else:
            mobile = request.query_params.get("mobile")
            if mobile:
                user_appointment = all_booked.filter(guest_mobile=mobile).first()
                if user_appointment and user_appointment.checked_in_at:
                    is_checked_in = True

        # 4. Gated Visibility Logic
        results = []
        for i, appt in enumerate(all_booked):
            is_self = user_appointment and appt.id == user_appointment.id
            
            # Detailed view for Owner or Self
            if is_owner or is_self:
                results.append(AppointmentSerializer(appt).data)
            # Anonymized view for Checked-In customers (only show other checked-in people)
            elif is_checked_in and appt.checked_in_at:
                data = AppointmentSerializer(appt).data
                # Anonymize name
                name = appt.user.get_full_name() if appt.user else appt.guest_name
                if name:
                    data["display_name"] = f"{name[0]}***"
                else:
                    data["display_name"] = "Customer"
                # Remove sensitive fields
                data.pop("guest_mobile", None)
                data.pop("user", None)
                results.append(data)
            # If not owner and not self and appt not checked in, we skip it for the public list
        
        if not is_owner and not is_checked_in:
            # If guest or not checked in, only show their own position if they have a booking
            if user_appointment:
                my_pos = list(all_booked).index(user_appointment) + 1
                return Response({
                    "position": my_pos,
                    "total_in_queue": all_booked.count(),
                    "my_booking": AppointmentSerializer(user_appointment).data,
                    "message": "Scan QR at salon to see full live queue."
                })
            else:
                return Response({
                    "total_in_queue": all_booked.count(),
                    "message": "Join the queue or scan QR if you already have a booking."
                })

        return Response({
            "total_in_queue": all_booked.count(),
            "queue": results,
            "is_full_access": is_owner or is_checked_in
        })
