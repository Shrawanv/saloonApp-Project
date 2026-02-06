"""Salon list (authenticated). Pagination required for list."""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from salons.models import Salon
from api.serializers import SalonSerializer


class SalonListPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class SalonListAPIView(APIView):
    """GET: list active salons (paginated)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Salon.objects.filter(is_active=True).order_by("name")
        paginator = SalonListPagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            ser = SalonSerializer(page, many=True)
            return Response(ser.data, status=status.HTTP_200_OK)
        ser = SalonSerializer(qs, many=True)
        return Response(ser.data, status=status.HTTP_200_OK)


class SalonDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            salon = Salon.objects.get(id=int(pk), is_active=True)
        except (ValueError, Salon.DoesNotExist):
            return Response({"detail": "Salon not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(SalonSerializer(salon).data, status=status.HTTP_200_OK)
