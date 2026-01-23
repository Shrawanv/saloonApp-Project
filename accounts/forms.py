from django import forms
from .models import User
from django.conf import settings

class AdminUserCreationForm(forms.ModelForm):
    """
    Admin form to create user with auto-generated password
    """

    class Meta:
        model = User
        fields = (
            "username",
            "first_name",
            "last_name",
            "email",
            "mobile",
            "role",
            "is_active",
            "is_staff",
        )

    def save(self, commit=True):
        user = super().save(commit=False)

        # 🔐 Set default hashed password
        user.set_password(settings.DEFAULT_USER_PASSWORD)

        if commit:
            user.save()

        return user
