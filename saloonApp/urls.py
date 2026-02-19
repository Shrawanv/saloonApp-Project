"""
URL configuration for saloonApp project.
API-first: root and /api/ return JSON; only /admin/ uses templates.
"""
from django.contrib import admin
from django.urls import path, include

from api.views.root import root_view

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("", root_view),
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
