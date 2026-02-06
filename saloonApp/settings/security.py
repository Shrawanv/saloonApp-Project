"""
Security-related settings. No secrets in code; use env vars via python-decouple.
"""
from decouple import config

SECRET_KEY = config(
    "SECRET_KEY",
    default="django-insecure-dev-key-change-in-production",
)

# Origins trusted for CSRF (required when API is used from another origin, e.g. tunnel/mobile).
# Env: comma-separated list (e.g. CSRF_TRUSTED_ORIGINS="https://foo.trycloudflare.com,http://localhost:8000").
# Default includes local dev + Cloudflare and ngrok tunnel wildcards.
CSRF_TRUSTED_ORIGINS = config(
    "CSRF_TRUSTED_ORIGINS",
    default=(
        "http://localhost:8000,"
        "http://localhost:3000,"
        "http://localhost:5173,"
        "http://127.0.0.1:8000,"
        "https://*.trycloudflare.com,"
        "https://*.ngrok-free.dev"
    ),
    cast=lambda v: [s.strip() for s in str(v).split(",") if s.strip()],
)
