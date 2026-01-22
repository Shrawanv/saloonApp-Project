from django.db.models import Count, Q, F
from datetime import datetime

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from services.models import SalonSlot

from rest_framework.permissions import AllowAny


class AvailableSlotsAPIView(APIView):
    """
    Returns only slots that still have remaining capacity
    for a given salon and date.
    """

    permission_classes = [AllowAny]  # Allow unrestricted access

    def get(self, request, salon_id):
        date_str = request.query_params.get("date")

        #Validate date param
        if not date_str:
            return Response(
                {"error": "date query parameter is required (YYYY-MM-DD)"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        #Fetch slots + count booked appointments per slot
        slots = (
            SalonSlot.objects
            .filter(salon_id=salon_id)
            .annotate(
                booked_count=Count(
                    "appointments",
                    filter=Q(
                        appointments__appointment_date=date,
                        appointments__status="Booked",  # match your DB value
                    ),
                )
            )
            .filter(booked_count__lt=F("max_capacity"))  # capacity-aware
            .order_by("start_time")
        )

        #Build API response
        data = [
            {
                "id": slot.id,
                "start_time": slot.start_time,
                "end_time": slot.end_time,
                "max_capacity": slot.max_capacity,
                "booked": slot.booked_count,
                "remaining_capacity": slot.max_capacity - slot.booked_count,
            }
            for slot in slots
        ]

        return Response(data, status=status.HTTP_200_OK)
