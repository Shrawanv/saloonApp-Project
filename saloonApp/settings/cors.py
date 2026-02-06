"""
CORS configuration. Add django-cors-headers to INSTALLED_APPS and
CorsMiddleware to MIDDLEWARE in base.py when needed.
"""
from decouple import config

# Comma-separated origins (e.g. https://frontend.example.com)
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:3000,http://localhost:5173",
    cast=lambda v: [s.strip() for s in v.split(",") if s.strip()],
)

CORS_ALLOW_CREDENTIALS = True
