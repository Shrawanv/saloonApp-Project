from rest_framework.generics import CreateAPIView
from rest_framework.permissions import IsAuthenticated

from api.serializers.bookings import AppointmentCreateSerializer
from bookings.models import Appointment
from api.permissions import IsCustomer


class BookAppointmentAPIView(CreateAPIView):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentCreateSerializer
    permission_classes = [IsAuthenticated, IsCustomer]
