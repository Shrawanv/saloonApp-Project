"""Vendor salon CRUD. Ownership via queryset filtering (salon.owner == request.user)."""
from django.db import transaction, IntegrityError

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from salons.models import Salon
from api.serializers import SalonSerializer, VendorSalonCreateUpdateSerializer
from api.permissions import IsVendor


class VendorSalonListPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class VendorSalonListCreateAPIView(APIView):
    """GET: list own salons (paginated). POST: create salon (owner=request.user)."""
    permission_classes = [IsVendor]

    def get(self, request):
        qs = request.user.salons.order_by("name")
        paginator = VendorSalonListPagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            ser = SalonSerializer(page, many=True)
            return paginator.get_paginated_response(ser.data)
        ser = SalonSerializer(qs, many=True)
        return Response({"results": ser.data}, status=status.HTTP_200_OK)

    def post(self, request):
        ser = VendorSalonCreateUpdateSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        data = ser.validated_data
        try:
            with transaction.atomic():
                salon = Salon.objects.create(
                    owner=request.user,
                    name=data["name"],
                    mobile=data["mobile"],
                    pincode=data["pincode"],
                    opening_time=data["opening_time"],
                    closing_time=data["closing_time"],
                    break_start_time=data.get("break_start_time"),
                    break_end_time=data.get("break_end_time"),
                    slot_duration=data.get("slot_duration", 60),
                    max_capacity_per_slot=data.get("max_capacity_per_slot", 1),
                    is_active=data.get("is_active", True),
                )
        except IntegrityError:
            return Response(
                {"detail": "Invalid or duplicate data; salon could not be created."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(SalonSerializer(salon).data, status=status.HTTP_201_CREATED)


class VendorSalonDetailAPIView(APIView):
    """GET, PATCH, DELETE: one salon. Queryset filtered by owner=request.user."""
    permission_classes = [IsVendor]

    def get_queryset(self, request):
        return request.user.salons.all()

    def get(self, request, pk):
        salon = self.get_queryset(request).filter(pk=pk).first()
        if not salon:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(SalonSerializer(salon).data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        salon = self.get_queryset(request).filter(pk=pk).first()
        if not salon:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        ser = VendorSalonCreateUpdateSerializer(data=request.data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        for key, value in ser.validated_data.items():
            setattr(salon, key, value)
        salon.save()
        return Response(SalonSerializer(salon).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        salon = self.get_queryset(request).filter(pk=pk).first()
        if not salon:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        salon.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
