"""
Security-related settings. No secrets in code; use env vars via python-decouple.
"""
from decouple import config

SECRET_KEY = config(
    "SECRET_KEY",
    default="django-insecure-dev-key-change-in-production",
)

# Comma-separated origins for CSRF trust (e.g. https://app.example.com)
CSRF_TRUSTED_ORIGINS = config(
    "CSRF_TRUSTED_ORIGINS",
    default="https://*.ngrok-free.dev",
    cast=lambda v: [s.strip() for s in v.split(",") if s.strip()],
)
