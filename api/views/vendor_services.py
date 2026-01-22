from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from services.models import Service
from api.serializers.services import ServiceSerializer


class VendorServiceViewSet(ModelViewSet):
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Service.objects.filter(
            salon__owner=self.request.user
        )

    def perform_create(self, serializer):
        salon = self.request.user.salons.first()
        serializer.save(salon=salon)
