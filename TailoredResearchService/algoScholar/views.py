from django.shortcuts import render
from django.http import JsonResponse
from .models import Chat

def landing_page(request):
    return render(request, 'landing_page.html')

def record_click(request):
    if request.method == 'POST':
        message = request.POST.get('message')
        Chat.objects.create(message=message)
        return JsonResponse({'status': 'success'})
    else:
        return JsonResponse({'status': 'error'})
