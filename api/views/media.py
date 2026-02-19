from rest_framework import status, parsers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from salons.models import Salon, SalonMedia
from api.serializers import UserSerializer, SalonSerializer, SalonMediaSerializer
from api.permissions import IsVendor

class ProfilePictureUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        user = request.user
        if 'profile_picture' not in request.FILES:
            return Response({"detail": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)
        
        user.profile_picture = request.FILES['profile_picture']
        user.save()
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)

class SalonLogoUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsVendor]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, pk):
        salon = get_object_or_404(Salon, id=pk, owner=request.user)
        if 'logo' not in request.FILES:
            return Response({"detail": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)
        
        salon.logo = request.FILES['logo']
        salon.save()
        return Response(SalonSerializer(salon).data, status=status.HTTP_200_OK)

class SalonMediaListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsVendor]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get(self, request, pk):
        salon = get_object_or_404(Salon, id=pk, owner=request.user)
        media = salon.media.all()
        return Response(SalonMediaSerializer(media, many=True).data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        salon = get_object_or_404(Salon, id=pk, owner=request.user)
        if 'file' not in request.FILES:
            return Response({"detail": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)
        
        media_type = request.data.get('media_type', 'IMAGE')
        if media_type not in ['IMAGE', 'VIDEO']:
            return Response({"detail": "Invalid media type."}, status=status.HTTP_400_BAD_REQUEST)

        media = SalonMedia.objects.create(
            salon=salon,
            file=request.FILES['file'],
            media_type=media_type
        )
        return Response(SalonMediaSerializer(media).data, status=status.HTTP_201_CREATED)

class SalonMediaDeleteAPIView(APIView):
    permission_classes = [IsAuthenticated, IsVendor]

    def delete(self, request, pk):
        media = get_object_or_404(SalonMedia, id=pk, salon__owner=request.user)
        media.file.delete() # Also delete the physical file
        media.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
