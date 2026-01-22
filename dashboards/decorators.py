from functools import wraps
from django.http import HttpResponseForbidden


def role_required(role_name):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return HttpResponseForbidden("Login required")

            if getattr(request.user, "role", None) != role_name:
                return HttpResponseForbidden("Permission denied")

            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator


admin_required = role_required("ADMIN")
vendor_required = role_required("VENDOR")
customer_required = role_required("CUSTOMER")
