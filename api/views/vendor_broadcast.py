from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from salons.models import BroadcastOffer, Salon
from api.serializers import BroadcastOfferSerializer
from api.permissions import IsVendor

class VendorBroadcastListCreateAPIView(APIView):
    permission_classes = [IsVendor]

    def get(self, request):
        # List all broadcast offers for the user's salons
        salon_id = request.query_params.get("salon")
        if salon_id:
            salon = get_object_or_404(request.user.salons.all(), pk=salon_id)
            broadcasts = BroadcastOffer.objects.filter(salon=salon)
        else:
            salons = request.user.salons.all()
            broadcasts = BroadcastOffer.objects.filter(salon__in=salons)
            
        serializer = BroadcastOfferSerializer(broadcasts, many=True)
        return Response(serializer.data)

    def post(self, request):
        salon_id = request.data.get("salon")
        salon = get_object_or_404(request.user.salons.all(), pk=salon_id)
        
        serializer = BroadcastOfferSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(salon=salon)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VendorBroadcastActionAPIView(APIView):
    permission_classes = [IsVendor]

    def post(self, request, pk):
        broadcast = get_object_or_404(BroadcastOffer, pk=pk, salon__owner=request.user)
        action = request.data.get("action")

        if action == "send":
            if broadcast.is_sent:
                return Response({"detail": "Broadcast already sent."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Simulation: Mark as sent
            broadcast.is_sent = True
            broadcast.save()
            return Response({"detail": "Broadcast sent successfully!"}, status=status.HTTP_200_OK)
            
        return Response({"detail": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        broadcast = get_object_or_404(BroadcastOffer, pk=pk, salon__owner=request.user)
        broadcast.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
