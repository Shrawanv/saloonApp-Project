from datetime import date
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from salons.models import BroadcastOffer, Salon
from bookings.models import Appointment

class CouponValidateAPIView(APIView):
    """
    POST: Validate a coupon code for a specific salon and user.
    """
    def post(self, request):
        salon_id = request.data.get("salon_id")
        code = request.data.get("code")
        
        if not salon_id or not code:
            return Response({"detail": "Salon ID and code are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            offer = BroadcastOffer.objects.get(
                salon_id=salon_id,
                offer_code__iexact=code,
                is_sent=True
            )
        except BroadcastOffer.DoesNotExist:
            return Response({"detail": "Invalid or inactive coupon code."}, status=status.HTTP_404_NOT_FOUND)
            
        # Check expiry
        if offer.expiry_date and offer.expiry_date < date.today():
            return Response({"detail": "This coupon has expired."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Check target audience
        user = request.user
        if offer.target_audience == "NEW":
            previous_apts = Appointment.objects.filter(user=user, salon_id=salon_id).exclude(status="CANCELLED")
            if previous_apts.exists():
                return Response({"detail": "This coupon is only for new customers."}, status=status.HTTP_400_BAD_REQUEST)
        elif offer.target_audience == "LOYAL":
            previous_apts_count = Appointment.objects.filter(user=user, salon_id=salon_id, status="COMPLETED").count()
            if previous_apts_count < 3: # Let's say 3+ completed bookings makes a loyal customer
                return Response({"detail": "This coupon is reserved for our loyal customers."}, status=status.HTTP_400_BAD_REQUEST)
                
        return Response({
            "code": offer.offer_code,
            "discount_type": offer.discount_type,
            "discount_value": offer.discount_value,
            "title": offer.title
        }, status=status.HTTP_200_OK)
