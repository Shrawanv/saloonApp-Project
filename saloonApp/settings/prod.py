"""
Production settings. Load with DJANGO_SETTINGS_MODULE=saloonApp.settings.prod
No secrets in code; require SECRET_KEY and ALLOWED_HOSTS from env.
"""
from decouple import config, Csv

from .base import *  # noqa: F401, F403

DEBUG = False
ALLOWED_HOSTS = config("ALLOWED_HOSTS", cast=Csv())

# Optional: use DB from env in production
_db_engine = config("DATABASE_ENGINE", default="django.db.backends.sqlite3")
if _db_engine != "django.db.backends.sqlite3":
    DATABASES["default"] = {
        "ENGINE": _db_engine,
        "NAME": config("DATABASE_NAME"),
        "USER": config("DATABASE_USER", default=""),
        "PASSWORD": config("DATABASE_PASSWORD", default=""),
        "HOST": config("DATABASE_HOST", default=""),
        "PORT": config("DATABASE_PORT", default=""),
        "OPTIONS": {},
    }

# Security headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=True, cast=bool)
