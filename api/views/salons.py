"""Salon list (authenticated)."""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from salons.models import Salon
from api.serializers import SalonSerializer


class SalonListAPIView(APIView):
    """GET: list active salons."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Salon.objects.filter(is_active=True).order_by("name")
        ser = SalonSerializer(qs, many=True)
        return Response({"salons": ser.data}, status=status.HTTP_200_OK)
