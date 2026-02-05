"""Services by salon (authenticated). Vendor service CRUD (vendor only)."""
from django.db import transaction, IntegrityError

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from salons.models import Salon
from services.models import Service
from api.serializers import ServiceSerializer, VendorServiceCreateSerializer
from api.permissions import IsVendor


class VendorServiceListPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class ServiceListBySalonPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class ServiceListBySalonAPIView(APIView):
    """GET: list active services for a salon (paginated). Query: salon_id."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        salon_id = request.query_params.get("salon_id")
        if not salon_id:
            return Response(
                {"detail": "salon_id required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            salon = Salon.objects.get(id=int(salon_id), is_active=True)
        except (ValueError, Salon.DoesNotExist):
            return Response(
                {"detail": "Salon not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        qs = Service.objects.filter(salon=salon, is_active=True).select_related("salon").order_by("name")
        paginator = ServiceListBySalonPagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            ser = ServiceSerializer(page, many=True)
            return paginator.get_paginated_response(ser.data)
        ser = ServiceSerializer(qs, many=True)
        return Response({"results": ser.data}, status=status.HTTP_200_OK)


class VendorServiceListCreateAPIView(APIView):
    """Vendor: GET list own services (optional ?salon=id), POST create."""
    permission_classes = [IsAuthenticated, IsVendor]

    def get(self, request):
        salon_id = request.query_params.get("salon")
        if salon_id:
            services = Service.objects.filter(
                salon__id=salon_id,
                salon__owner=request.user,
            ).select_related("salon").order_by("name")
        else:
            services = Service.objects.filter(salon__owner=request.user).select_related("salon").order_by("name")
        paginator = VendorServiceListPagination()
        page = paginator.paginate_queryset(services, request)
        if page is not None:
            ser = ServiceSerializer(page, many=True)
            return paginator.get_paginated_response(ser.data)
        ser = ServiceSerializer(services, many=True)
        return Response({"results": ser.data}, status=status.HTTP_200_OK)

    def post(self, request):
        ser = VendorServiceCreateSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        data = ser.validated_data
        salon = Salon.objects.filter(id=data["salon_id"]).first()
        if not salon:
            return Response(
                {"detail": "Salon not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if salon.owner_id != request.user.id:
            return Response(
                {"detail": "You do not have permission to add services to this salon."},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            with transaction.atomic():
                service = Service.objects.create(
                    salon=salon,
                    name=data["name"],
                    price=data["price"],
                    duration=data["duration"],
                    is_active=data.get("is_active", True),
                )
        except IntegrityError:
            return Response(
                {"detail": "Invalid or duplicate data; service could not be created."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            ServiceSerializer(service).data,
            status=status.HTTP_201_CREATED,
        )


class VendorServiceDetailAPIView(APIView):
    """Vendor: GET, PATCH, DELETE one service. Toggle: PATCH is_active."""
    permission_classes = [IsAuthenticated, IsVendor]

    def get_service(self, request, pk):
        return Service.objects.filter(
            id=pk,
            salon__owner=request.user,
        ).first()

    def get(self, request, pk):
        service = self.get_service(request, pk)
        if not service:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ServiceSerializer(service).data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        service = self.get_service(request, pk)
        if not service:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        ser = ServiceSerializer(service, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        service = self.get_service(request, pk)
        if not service:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        service.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
