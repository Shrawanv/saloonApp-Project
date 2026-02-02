"""
Root API view. Returns JSON only; no templates.
"""
from django.http import JsonResponse


def root_view(request):
    """Root URL (/) returns API info as JSON."""
    return JsonResponse(
        {
            "api": "saloon",
            "version": "1",
            "docs": "/api/",
            "admin": "/admin/",
            "health": "ok",
        },
        json_dumps_params={"indent": 2},
    )
