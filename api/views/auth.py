"""
Public auth endpoints only: login, refresh, logout, CSRF, me.
JWT stored in HttpOnly cookies only; never returned in JSON.
"""
from django.contrib.auth import authenticate
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from api.authentication import clear_jwt_cookies, set_jwt_cookies
from api.serializers import LoginSerializer, UserSerializer


class LoginView(APIView):
    """POST: username, password. Sets access + refresh in HttpOnly cookies; returns user only."""
    permission_classes = [AllowAny]

    def post(self, request):
        ser = LoginSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        user = authenticate(
            request,
            username=ser.validated_data["username"],
            password=ser.validated_data["password"],
        )
        if not user:
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if user.is_staff or user.is_superuser:
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        refresh = RefreshToken.for_user(user)
        response = Response(
            {"user": UserSerializer(user).data},
            status=status.HTTP_200_OK,
        )
        set_jwt_cookies(response, str(refresh.access_token), str(refresh))
        return response


class RefreshView(APIView):
    """POST: refresh token read from cookie. Sets new access in cookie; no token in body."""
    permission_classes = [AllowAny]

    def post(self, request):
        from rest_framework_simplejwt.tokens import RefreshToken
        from django.conf import settings

        refresh_cookie_name = getattr(settings, "JWT_REFRESH_COOKIE_NAME", "refresh_token")
        raw = request.COOKIES.get(refresh_cookie_name)
        if not raw:
            return Response(
                {"detail": "Refresh token missing."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            token = RefreshToken(raw)
        except Exception:
            return Response(
                {"detail": "Invalid or expired refresh token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        new_access = str(token.access_token)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        set_jwt_cookies(response, new_access, refresh_token=None)
        return response


class LogoutView(APIView):
    """POST: clear JWT cookies. No auth required (idempotent)."""
    permission_classes = [AllowAny]

    def post(self, request):
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_jwt_cookies(response)
        return response


@require_GET
@ensure_csrf_cookie
def csrf_view(request):
    """
    GET-only endpoint to force Django to set the CSRF cookie.
    No templates, no token in JSON body.
    """
    return JsonResponse({"detail": "CSRF cookie set."})


class MeView(APIView):
    """GET: current authenticated user. Requires valid JWT cookie."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)
