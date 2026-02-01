"""Book appointment (customer only). List appointments (customer)."""
from datetime import date
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404

from salons.models import Salon
from api.serializers import BookAppointmentSerializer, AppointmentSerializer
from api.permissions import IsCustomer
from bookings.services import book_appointment


class BookAppointmentAPIView(APIView):
    """POST: book appointment. Customer only. Body: salon_id, service_ids[], appointment_date, slot_start."""
    permission_classes = [IsAuthenticated, IsCustomer]

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
        try:
            appointment = book_appointment(
                user=request.user,
                salon=salon,
                appointment_date=data["appointment_date"],
                slot_start=data["slot_start"],
                service_ids=data["service_ids"],
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
    """GET: list current user's appointments. Customer only."""
    permission_classes = [IsAuthenticated, IsCustomer]

    def get(self, request):
        qs = request.user.appointments.select_related("salon").prefetch_related("services").order_by("-appointment_date", "-slot_start")
        ser = AppointmentSerializer(qs, many=True)
        return Response({"appointments": ser.data}, status=status.HTTP_200_OK)
