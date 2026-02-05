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
            return paginator.get_paginated_response(ser.data)
        ser = SalonSerializer(qs, many=True)
        return Response({"results": ser.data}, status=status.HTTP_200_OK)
