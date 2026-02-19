from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404

from salons.models import Salon, Review
from api.serializers import ReviewSerializer

class ReviewPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50

class ReviewListCreateAPIView(APIView):
    """
    GET: List reviews for a salon (paginated).
    POST: Create a new review for a salon.
    """
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, salon_id):
        get_object_or_404(Salon, id=salon_id, is_active=True)
        reviews = Review.objects.filter(salon_id=salon_id)
        
        paginator = ReviewPagination()
        page = paginator.paginate_queryset(reviews, request)
        if page is not None:
            serializer = ReviewSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    def post(self, request, salon_id):
        salon = get_object_or_404(Salon, id=salon_id, is_active=True)
        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, salon=salon)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
