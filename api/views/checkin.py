from datetime import date
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404

from salons.models import Salon
from bookings.models import Appointment
from api.serializers import AppointmentSerializer

class CheckInAPIView(APIView):
    """
    POST: Mark an appointment as checked-in via QR scan.
    Identifies by user (if logged in) or mobile number (for guests).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        salon_id = request.data.get("salon_id")
        mobile = request.data.get("mobile")
        
        if not salon_id:
            return Response({"detail": "salon_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        salon = get_object_or_404(Salon, id=salon_id, is_active=True)
        today = date.today()

        # Find appointment:
        # 1. If user is authenticated, find their booking for today at this salon
        if request.user.is_authenticated:
            appointment = Appointment.objects.filter(
                user=request.user,
                salon=salon,
                appointment_date=today,
                status="BOOKED"
            ).first()
        # 2. If not authenticated, identify by mobile number
        elif mobile:
            appointment = Appointment.objects.filter(
                guest_mobile=mobile,
                salon=salon,
                appointment_date=today,
                status="BOOKED"
            ).first()
        else:
            return Response({"detail": "Identification required (Login or Mobile number)."}, status=status.HTTP_400_BAD_REQUEST)

        if not appointment:
            return Response({"detail": "No active booking found for today at this salon."}, status=status.HTTP_404_NOT_FOUND)

        if appointment.checked_in_at:
            return Response({"detail": "Already checked in.", "data": AppointmentSerializer(appointment).data}, status=status.HTTP_200_OK)

        appointment.checked_in_at = timezone.now()
        appointment.save(update_fields=["checked_in_at"])

        return Response({
            "detail": "Check-in successful.",
            "data": AppointmentSerializer(appointment).data
        }, status=status.HTTP_200_OK)
