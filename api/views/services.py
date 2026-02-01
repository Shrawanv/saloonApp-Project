"""Services by salon (authenticated). Vendor service CRUD (vendor only)."""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from salons.models import Salon
from services.models import Service
from api.serializers import ServiceSerializer
from api.permissions import IsVendor


class ServiceListBySalonAPIView(APIView):
    """GET: list active services for a salon. Query: salon_id."""
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
        qs = Service.objects.filter(salon=salon, is_active=True).order_by("name")
        ser = ServiceSerializer(qs, many=True)
        return Response({"services": ser.data}, status=status.HTTP_200_OK)


class VendorServiceListCreateAPIView(APIView):
    """Vendor: GET list own services (optional ?salon=id), POST create."""
    permission_classes = [IsAuthenticated, IsVendor]

    def get(self, request):
        salons = request.user.salons.filter(is_active=True)
        salon_id = request.query_params.get("salon")
        if salon_id:
            services = Service.objects.filter(
                salon__id=salon_id,
                salon__owner=request.user,
            )
        else:
            services = Service.objects.filter(salon__owner=request.user)
        ser = ServiceSerializer(services, many=True)
        return Response({"services": ser.data}, status=status.HTTP_200_OK)

    def post(self, request):
        salon_id = request.data.get("salon_id")
        if not salon_id:
            return Response(
                {"salon_id": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            salon = Salon.objects.get(id=int(salon_id), owner=request.user)
        except (ValueError, Salon.DoesNotExist):
            return Response(
                {"salon_id": ["Salon not found or not owned."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ser = ServiceSerializer(data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save(salon=salon, is_active=True)
        return Response(ser.data, status=status.HTTP_201_CREATED)


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
