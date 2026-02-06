"""Slot availability (authenticated)."""
from datetime import datetime
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from salons.models import Salon
from services.slot_utils import get_slot_availability


class SlotsAPIView(APIView):
    """GET: available slots. Query: salon_id, date (YYYY-MM-DD), duration_minutes (optional)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        salon_id = request.query_params.get("salon_id")
        date_str = request.query_params.get("date")
        if not salon_id or not date_str:
            return Response(
                {"detail": "salon_id and date required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"detail": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        duration_minutes = None
        dur_str = request.query_params.get("duration_minutes")
        if dur_str:
            try:
                duration_minutes = int(dur_str)
                if duration_minutes <= 0:
                    return Response(
                        {"detail": "duration_minutes must be positive."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except ValueError:
                return Response(
                    {"detail": "Invalid duration_minutes."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        try:
            salon = Salon.objects.get(id=int(salon_id), is_active=True)
        except (ValueError, Salon.DoesNotExist):
            return Response(
                {"detail": "Salon not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        slots = get_slot_availability(salon, target_date, duration_minutes=duration_minutes)
        data = [
            {
                "start": s["start"].strftime("%H:%M"),
                "end": s["end"].strftime("%H:%M"),
                "remaining": s["remaining"],
                "is_full": s["is_full"],
            }
            for s in slots
        ]
        return Response({"slots": data}, status=status.HTTP_200_OK)


class SlotsBySalonPathAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, salon_id):
        date_str = request.query_params.get("date")
        if not date_str:
            return Response({"detail": "date required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"detail": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        duration_minutes = None
        dur_str = request.query_params.get("duration_minutes")
        if dur_str:
            try:
                duration_minutes = int(dur_str)
                if duration_minutes <= 0:
                    return Response({"detail": "duration_minutes must be positive."}, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({"detail": "Invalid duration_minutes."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            salon = Salon.objects.get(id=int(salon_id), is_active=True)
        except (ValueError, Salon.DoesNotExist):
            return Response({"detail": "Salon not found."}, status=status.HTTP_404_NOT_FOUND)
        slots = get_slot_availability(salon, target_date, duration_minutes=duration_minutes)
        data = [s["start"].strftime("%H:%M") for s in slots if not s.get("is_full")]
        return Response({"slots": data}, status=status.HTTP_200_OK)
