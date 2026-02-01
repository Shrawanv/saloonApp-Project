"""
JWT authentication from HttpOnly cookies only. No JWT in JSON or headers.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings


class JWTCookieAuthentication(JWTAuthentication):
    """
    Read JWT access token from HttpOnly cookie only.
    Do not accept Authorization header for API (cookie-only).
    """

    def authenticate(self, request):
        cookie_name = getattr(
            settings,
            "JWT_ACCESS_COOKIE_NAME",
            "access_token",
        )
        raw_token = request.COOKIES.get(cookie_name)
        if not raw_token:
            return None
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token


def set_jwt_cookies(response, access_token, refresh_token=None):
    """Set access (and optionally refresh) token in HttpOnly cookies. No tokens in body."""
    from rest_framework_simplejwt.tokens import RefreshToken
    from datetime import datetime, timedelta

    access_cookie_name = getattr(settings, "JWT_ACCESS_COOKIE_NAME", "access_token")
    refresh_cookie_name = getattr(settings, "JWT_REFRESH_COOKIE_NAME", "refresh_token")
    max_age_access = getattr(settings, "JWT_COOKIE_MAX_AGE_ACCESS", 3600)
    max_age_refresh = getattr(settings, "JWT_COOKIE_MAX_AGE_REFRESH", 86400)
    httponly = getattr(settings, "JWT_COOKIE_HTTPONLY", True)
    secure = getattr(settings, "JWT_COOKIE_SECURE", False)
    samesite = getattr(settings, "JWT_COOKIE_SAMESITE", "Lax")

    cookie_kw = {"httponly": httponly, "secure": secure, "samesite": samesite}

    response.set_cookie(
        access_cookie_name,
        str(access_token),
        max_age=max_age_access,
        **cookie_kw,
    )
    if refresh_token is not None:
        response.set_cookie(
            refresh_cookie_name,
            str(refresh_token),
            max_age=max_age_refresh,
            **cookie_kw,
        )


def clear_jwt_cookies(response):
    """Clear JWT cookies on logout."""
    access_cookie_name = getattr(settings, "JWT_ACCESS_COOKIE_NAME", "access_token")
    refresh_cookie_name = getattr(settings, "JWT_REFRESH_COOKIE_NAME", "refresh_token")
    response.delete_cookie(access_cookie_name)
    response.delete_cookie(refresh_cookie_name)
