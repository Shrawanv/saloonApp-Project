"""
Django REST Framework and JWT-in-cookie config.
All APIs require authentication by default; public endpoints (login, refresh) are explicit.
"""
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "api.authentication.JWTCookieAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "UNAUTHENTICATED_USER": None,
}

# JWT stored ONLY in HttpOnly cookies (never in JSON body)
JWT_ACCESS_COOKIE_NAME = "access_token"
JWT_REFRESH_COOKIE_NAME = "refresh_token"
JWT_COOKIE_HTTPONLY = True
JWT_COOKIE_SECURE = False  # set True in prod over HTTPS
JWT_COOKIE_SAMESITE = "Lax"
JWT_COOKIE_MAX_AGE_ACCESS = 60 * 60  # 1 hour (match SIMPLE_JWT ACCESS_TOKEN_LIFETIME)
JWT_COOKIE_MAX_AGE_REFRESH = 24 * 60 * 60  # 1 day
