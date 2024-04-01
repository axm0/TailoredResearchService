from django.shortcuts import render, get_object_or_404
from .models import Document

def landing_page(request):
    return render(request, 'landing_page.html')
