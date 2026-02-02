"""
URL configuration for saloonApp project.
API-first: root and /api/ return JSON; only /admin/ uses templates.
"""
from django.contrib import admin
from django.urls import path, include

from api.views.root import root_view

urlpatterns = [
    path("", root_view),
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
]
