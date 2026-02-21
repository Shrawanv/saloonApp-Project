"""Book appointment (customer only). List appointments (customer)."""
from datetime import date

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404

from salons.models import Salon
from bookings.models import Appointment
from api.serializers import BookAppointmentSerializer, AppointmentSerializer
from api.permissions import IsCustomer


class BookingListPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100
from bookings.services import book_appointment


class BookAppointmentAPIView(APIView):
    """POST: book appointment. Support guest bookings. Body: salon_id, service_ids[], appointment_date, slot_start, [guest_name, guest_mobile]."""
    permission_classes = [AllowAny]

    def post(self, request):
        ser = BookAppointmentSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        data = ser.validated_data
        if data["appointment_date"] < date.today():
            return Response(
                {"detail": "Cannot book in the past."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        salon = get_object_or_404(Salon, id=data["salon_id"], is_active=True)
        
        user = request.user if request.user.is_authenticated else None
        guest_name = data.get("guest_name")
        guest_mobile = data.get("guest_mobile")

        try:
            appointment = book_appointment(
                user=user,
                guest_name=guest_name,
                guest_mobile=guest_mobile,
                salon=salon,
                appointment_date=data["appointment_date"],
                slot_start=data["slot_start"],
                service_ids=data["service_ids"],
                coupon_code=data.get("coupon_code"),
            )
        except ValidationError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            AppointmentSerializer(appointment).data,
            status=status.HTTP_201_CREATED,
        )


class MyAppointmentsAPIView(APIView):
    """GET: list current user's appointments (paginated). Customer only."""
    permission_classes = [IsAuthenticated, IsCustomer]

    def get(self, request):
        # Auto-cancel past bookings for this user
        Appointment.cancel_expired_appointments(user=request.user)
        
        qs = request.user.appointments.select_related("salon").prefetch_related("services")
        
        req_type = request.query_params.get('type')
        today = date.today()
        
        if req_type == 'upcoming':
            qs = qs.filter(appointment_date__gte=today, status='BOOKED')
        elif req_type == 'past':
            # Past is either explicitly cancelled/completed, or booked in the past (though cancel_expired should catch them)
            from django.db.models import Q
            qs = qs.filter(Q(status__in=['COMPLETED', 'CANCELLED']) | Q(appointment_date__lt=today))
            
        qs = qs.order_by("-appointment_date", "-slot_start")
        
        paginator = BookingListPagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            ser = AppointmentSerializer(page, many=True)
            return paginator.get_paginated_response(ser.data)
        
        ser = AppointmentSerializer(qs, many=True)
        return Response({"results": ser.data}, status=status.HTTP_200_OK)
