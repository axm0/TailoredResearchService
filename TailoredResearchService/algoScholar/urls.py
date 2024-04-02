from django.urls import path
from .views import landing_page, record_click

urlpatterns = [
    path('', landing_page, name='landing_page'),
    path('record_click/', record_click, name='record_click'),
    # Other URL patterns
]
