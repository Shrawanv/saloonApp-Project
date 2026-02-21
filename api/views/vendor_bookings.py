from datetime import datetime
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from api.permissions import IsVendor
from api.serializers import AppointmentSerializer
from bookings.models import Appointment


class VendorAppointmentListPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class VendorAppointmentListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsVendor]

    def get_queryset(self, request):
        return Appointment.objects.filter(salon__owner=request.user).select_related("salon", "user").prefetch_related("services").order_by("-appointment_date", "-slot_start")

    def get(self, request):
        # Auto-cancel past bookings for all salons owned by this vendor
        from salons.models import Salon
        vendor_salons = Salon.objects.filter(owner=request.user)
        for s in vendor_salons:
            Appointment.cancel_expired_appointments(salon=s)

        qs = self.get_queryset(request)
        salon_id = request.query_params.get("salon")
        date_str = request.query_params.get("date")
        start_date_str = request.query_params.get("start_date")
        end_date_str = request.query_params.get("end_date")
        status_filter = request.query_params.get("status")

        if salon_id:
            try:
                qs = qs.filter(salon__id=int(salon_id))
            except ValueError:
                return Response({"detail": "Invalid salon id."}, status=status.HTTP_400_BAD_REQUEST)
        
        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                qs = qs.filter(appointment_date=target_date)
            except ValueError:
                return Response({"detail": "Invalid format for 'date'. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        
        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
                qs = qs.filter(appointment_date__gte=start_date)
            except ValueError:
                return Response({"detail": "Invalid format for 'start_date'. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        
        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
                qs = qs.filter(appointment_date__lte=end_date)
            except ValueError:
                return Response({"detail": "Invalid format for 'end_date'. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        if status_filter:
            qs = qs.filter(status=status_filter)
        
        confirmed_only = request.query_params.get("confirmed")
        if confirmed_only == "true":
            qs = qs.filter(checked_in_at__isnull=False)
        elif confirmed_only == "false":
            qs = qs.filter(checked_in_at__isnull=True)

        paginator = VendorAppointmentListPagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            ser = AppointmentSerializer(page, many=True)
            return paginator.get_paginated_response(ser.data)
        ser = AppointmentSerializer(qs, many=True)
        return Response({"results": ser.data}, status=status.HTTP_200_OK)


class VendorAppointmentUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsVendor]

    def post(self, request, pk):
        appointment = Appointment.objects.filter(id=pk, salon__owner=request.user).first()
        if not appointment:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        
        action = request.data.get("action")
        if action == "check_in":
            from django.utils import timezone
            appointment.checked_in_at = timezone.now()
            appointment.save(update_fields=["checked_in_at"])
            return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)
        
        if action == "undo_check_in":
            appointment.checked_in_at = None
            appointment.save(update_fields=["checked_in_at"])
            return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)

        new_payment_status = request.data.get("payment_status")
        if new_payment_status:
            if new_payment_status not in {"PENDING", "PAID", "FAILED"}:
                return Response({"detail": "Invalid payment status."}, status=status.HTTP_400_BAD_REQUEST)
            appointment.payment_status = new_payment_status

        new_payment_mode = request.data.get("payment_mode")
        if new_payment_mode:
            if new_payment_mode not in {"UNSET", "CASH", "ONLINE"}:
                return Response({"detail": "Invalid payment mode."}, status=status.HTTP_400_BAD_REQUEST)
            appointment.payment_mode = new_payment_mode

        # Rescheduling support
        new_date = request.data.get("appointment_date")
        new_time = request.data.get("slot_start")
        
        if new_date or new_time:
            from bookings.services import is_slot_available
            target_date = new_date if new_date else str(appointment.appointment_date)
            target_time = new_time if new_time else str(appointment.slot_start)
            
            # Check availability (excluding current appointment)
            available = is_slot_available(
                salon=appointment.salon,
                appointment_date=target_date,
                slot_start=target_time,
                duration_minutes=appointment.duration_minutes,
                exclude_appointment_id=appointment.id
            )
            
            if not available:
                return Response({"detail": "The selected slot is no longer available."}, status=status.HTTP_400_BAD_REQUEST)
            
            if new_date:
                appointment.appointment_date = target_date
            if new_time:
                appointment.slot_start = target_time

        new_status = request.data.get("status")
        if new_status:
            if new_status not in {"BOOKED", "COMPLETED", "CANCELLED"}:
                return Response({"detail": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)
            if appointment.status == "CANCELLED" or appointment.status == "COMPLETED":
                if appointment.status != new_status:
                    return Response({"detail": "Cannot update a finalised appointment status."}, status=status.HTTP_400_BAD_REQUEST)
            appointment.status = new_status
        
        appointment.save()
        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)


class VendorWalkInBookingAPIView(APIView):
    permission_classes = [IsAuthenticated, IsVendor]

    def post(self, request):
        from bookings.services import book_appointment
        from salons.models import Salon
        from api.serializers import BookAppointmentSerializer
        from django.utils import timezone

        serializer = BookAppointmentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        salon_id = serializer.validated_data["salon_id"]
        salon = Salon.objects.filter(id=salon_id, owner=request.user).first()
        if not salon:
            return Response({"detail": "Salon not found or not owned by you."}, status=status.HTTP_404_NOT_FOUND)

        try:
            appointment = book_appointment(
                user=None,  # Walk-ins are guests
                salon=salon,
                appointment_date=serializer.validated_data["appointment_date"],
                slot_start=serializer.validated_data["slot_start"],
                service_ids=serializer.validated_data["service_ids"],
                guest_name=serializer.validated_data.get("guest_name"),
                guest_mobile=serializer.validated_data.get("guest_mobile"),
            )

            # Auto-check-in if requested
            if request.data.get("confirm"):
                appointment.checked_in_at = timezone.now()
                appointment.save(update_fields=["checked_in_at"])

            return Response(AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
