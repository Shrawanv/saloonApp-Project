from datetime import datetime
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from api.permissions import IsVendor
from api.serializers import AppointmentSerializer
from bookings.models import Appointment


class VendorAppointmentListPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class VendorAppointmentListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsVendor]

    def get_queryset(self, request):
        return Appointment.objects.filter(salon__owner=request.user).select_related("salon", "user").prefetch_related("services").order_by("-appointment_date", "-slot_start")

    def get(self, request):
        qs = self.get_queryset(request)
        salon_id = request.query_params.get("salon")
        date_str = request.query_params.get("date")
        status_filter = request.query_params.get("status")

        if salon_id:
            try:
                qs = qs.filter(salon__id=int(salon_id))
            except ValueError:
                return Response({"detail": "Invalid salon id."}, status=status.HTTP_400_BAD_REQUEST)
        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                return Response({"detail": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
            qs = qs.filter(appointment_date=target_date)
        if status_filter:
            qs = qs.filter(status=status_filter)

        paginator = VendorAppointmentListPagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            ser = AppointmentSerializer(page, many=True)
            return paginator.get_paginated_response(ser.data)
        ser = AppointmentSerializer(qs, many=True)
        return Response({"results": ser.data}, status=status.HTTP_200_OK)


class VendorAppointmentUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsVendor]

    def post(self, request, pk):
        appointment = Appointment.objects.filter(id=pk, salon__owner=request.user).first()
        if not appointment:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        new_status = request.data.get("status")
        if new_status not in {"BOOKED", "COMPLETED", "CANCELLED"}:
            return Response({"detail": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)
        if appointment.status == "CANCELLED" or appointment.status == "COMPLETED":
            return Response({"detail": "Cannot update a finalised appointment."}, status=status.HTTP_400_BAD_REQUEST)
        appointment.status = new_status
        appointment.save(update_fields=["status"])
        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)
