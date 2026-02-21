from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from api.permissions import IsVendor
from bookings.models import Appointment
from salons.models import Salon, Review
from api.serializers import ReviewSerializer

class VendorReportsAPIView(APIView):
    """
    API for vendor-specific analytics and reports.
    Requires authentication and VENDOR role.
    """
    permission_classes = [IsVendor]

    def get(self, request):
        salon_id = request.query_params.get('salon_id')
        
        # Determine the salon to report on
        if not salon_id:
            salon = request.user.salons.first()
            if not salon:
                return Response({"detail": "No salon found for this vendor."}, status=status.HTTP_404_NOT_FOUND)
        else:
            salon = request.user.salons.filter(id=salon_id).first()
            if not salon:
                return Response({"detail": "Salon not found or access denied."}, status=status.HTTP_404_NOT_FOUND)

        # --- 1. Earnings Summary ---
        # Overall total from all completed and paid bookings
        total_earnings_data = Appointment.objects.filter(
            salon=salon,
            status='COMPLETED',
            payment_status='PAID'
        ).aggregate(total=Sum('total_amount'))
        
        total_earnings = total_earnings_data['total'] or 0

        # Daily revenue for the last 30 days
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        daily_earnings = Appointment.objects.filter(
            salon=salon,
            status='COMPLETED',
            payment_status='PAID',
            appointment_date__gte=thirty_days_ago
        ).values('appointment_date').annotate(
            revenue=Sum('total_amount'),
            appointments_count=Count('id')
        ).order_by('appointment_date')

        # --- 2. Frequent Customers ---
        # Find top 10 loyal customers by visit count
        # We group by mobile to track guest and registered users consistently where possible
        frequent_customers = Appointment.objects.filter(
            salon=salon,
            status='COMPLETED'
        ).values(
            'guest_name', 
            'guest_mobile', 
            'user__first_name', 
            'user__last_name', 
            'user__username'
        ).annotate(
            visit_count=Count('id'),
            total_spent=Sum('total_amount')
        ).order_by('-visit_count')[:10]

        # --- 3. Ratings & Feedback ---
        ratings_stats = Review.objects.filter(salon=salon).aggregate(
            avg_rating=Avg('rating'),
            review_count=Count('id')
        )
        
        # Ratings Distribution (1-5 stars)
        rating_distribution = Review.objects.filter(salon=salon).values('rating').annotate(
            count=Count('id')
        ).order_by('rating')
        
        # Ensure all ratings 1-5 are present in the response
        dist_dict = {i: 0 for i in range(1, 6)}
        for entry in rating_distribution:
            dist_dict[entry['rating']] = entry['count']
        
        final_distribution = [{"rating": k, "count": v} for k, v in dist_dict.items()]

        # Latest reviews for the 'Recent Activity' feel
        recent_reviews = Review.objects.filter(salon=salon).order_by('-created_at')[:10]
        reviews_data = ReviewSerializer(recent_reviews, many=True).data

        return Response({
            "salon": {
                "id": salon.id,
                "name": salon.name
            },
            "earnings": {
                "total_revenue": float(total_earnings),
                "daily_stats": daily_earnings
            },
            "customers": frequent_customers,
            "reviews": {
                "average_rating": ratings_stats['avg_rating'] or 0,
                "total_count": ratings_stats['review_count'],
                "distribution": final_distribution,
                "recent_list": reviews_data
            }
        }, status=status.HTTP_200_OK)
