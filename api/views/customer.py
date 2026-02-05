"""Customer CRUD: profile (read/update), bookings (list, cancel). Ownership at queryset level."""
from datetime import date

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from api.serializers import UserSerializer, CustomerProfileUpdateSerializer, AppointmentSerializer
from api.permissions import IsCustomer


class CustomerProfileAPIView(APIView):
    """GET: read own profile. PATCH: update own profile (first_name, last_name, mobile, pincode)."""
    permission_classes = [IsAuthenticated, IsCustomer]

    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)

    def patch(self, request):
        ser = CustomerProfileUpdateSerializer(data=request.data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        for key, value in ser.validated_data.items():
            setattr(request.user, key, value)
        request.user.save()
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


class CustomerBookingListPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class CustomerBookingListAPIView(APIView):
    """GET: list own bookings (paginated). Queryset filtered by request.user."""
    permission_classes = [IsAuthenticated, IsCustomer]

    def get(self, request):
        qs = (
            request.user.appointments
            .select_related("salon")
            .prefetch_related("services")
            .order_by("-appointment_date", "-slot_start")
        )
        paginator = CustomerBookingListPagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            ser = AppointmentSerializer(page, many=True)
            return paginator.get_paginated_response(ser.data)
        ser = AppointmentSerializer(qs, many=True)
        return Response({"results": ser.data}, status=status.HTTP_200_OK)


class CustomerBookingDetailAPIView(APIView):
    """GET: read one own booking. DELETE: cancel own booking (only BOOKED, appointment_date >= today)."""
    permission_classes = [IsAuthenticated, IsCustomer]

    def get_queryset(self, request):
        return request.user.appointments.select_related("salon").prefetch_related("services")

    def get(self, request, pk):
        appointment = self.get_queryset(request).filter(pk=pk).first()
        if not appointment:
            return Response(
                {"detail": "Not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        appointment = self.get_queryset(request).filter(pk=pk).first()
        if not appointment:
            return Response(
                {"detail": "Not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if appointment.status != "BOOKED":
            return Response(
                {"detail": "Only booked appointments can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if appointment.appointment_date < date.today():
            return Response(
                {"detail": "Cannot cancel past appointments."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        appointment.status = "CANCELLED"
        appointment.save(update_fields=["status"])
        return Response(status=status.HTTP_204_NO_CONTENT)
