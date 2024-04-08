from django.urls import path
from .views import landing_page, record_click, get_chat_session, create_chat_session

urlpatterns = [
    path('', landing_page, name='landing_page'),
    path('record_click/', record_click, name='record_click'),
    path('get_chat_session/', get_chat_session, name='get_chat_session'),
    path('create_chat_session/', create_chat_session, name='create_chat_session'),
]
