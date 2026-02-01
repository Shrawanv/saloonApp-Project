"""
Local / development settings. Load with DJANGO_SETTINGS_MODULE=saloonApp.settings.dev
"""
from .base import *  # noqa: F401, F403

DEBUG = True
ALLOWED_HOSTS = ["*"]
