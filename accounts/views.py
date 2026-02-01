from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render, redirect


def home_view(request):
    """Root home page with links to Admin and Login."""
    return render(request, "home.html")


def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(request, username=username, password=password)

        #Invalid credentials OR admin trying to use custom login
        if not user:
            return render(request, "accounts/login.html", {
                "error": "Invalid username or password"
            })

        #Admins must NOT use custom login
        if user.is_staff or user.is_superuser:
            return render(request, "accounts/login.html", {
                "error": "Invalid username or password"
            })

        #Vendor 
        if user.role == "VENDOR":
            login(request, user)
            return redirect("/vendor/")

        #Customer
        if user.role == "CUSTOMER":
            login(request, user)
            return redirect("/customer/")

        #Any unexpected role (future safety)
        return render(request, "accounts/login.html", {
            "error": "Invalid authentication"
        })

    return render(request, "accounts/login.html")

def logout_view(request):
    logout(request)
    return redirect("/login/")
