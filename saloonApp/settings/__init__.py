"""
Laravel-style modular settings.
Use DJANGO_SETTINGS_MODULE=saloonApp.settings.dev or saloonApp.settings.prod.
If set to saloonApp.settings (this package), defaults to dev.
"""
from decouple import config

if config("DJANGO_ENV", default="dev") == "prod":
    from .prod import *  # noqa: F401, F403
else:
    from .dev import *  # noqa: F401, F403
