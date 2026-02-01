"""
Authentication and JWT configuration. Use env vars for secrets.
"""
from datetime import timedelta
from decouple import config

AUTH_USER_MODEL = "accounts.User"

LOGIN_URL = "/login/"
LOGOUT_REDIRECT_URL = "/"
LOGIN_REDIRECT_URL = "/"

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

DEFAULT_USER_PASSWORD = config("DEFAULT_USER_PASSWORD", default="12345")
