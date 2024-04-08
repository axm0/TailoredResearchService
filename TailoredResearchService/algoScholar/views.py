from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

chat_sessions = {
    'Session 1': [
        {'sender': 'user', 'message': 'Hello!'},
        {'sender': 'bot', 'message': 'Hi there! How can I assist you today?'},
    ],
    'Session 2': [
        {'sender': 'user', 'message': 'What is the capital of France?'},
        {'sender': 'bot', 'message': 'The capital of France is Paris.'},
    ],
    'Session 3': [],
}

@csrf_exempt
@require_http_methods(["POST"])
def record_click(request):
    message = request.POST.get('message', '')
    session_id = request.POST.get('session_id', 'Session 1')
    chat_sessions[session_id].append({'sender': 'user', 'message': message})
    bot_response = {'sender': 'bot', 'message': 'Received message: {}'.format(message)}
    chat_sessions[session_id].append(bot_response)
    return JsonResponse(bot_response)

def get_chat_session(request):
    session_id = request.GET.get('session_id', 'Session 1')
    chat_history = chat_sessions.get(session_id, [])
    return JsonResponse({'chat_history': chat_history})

def create_chat_session(request):
    new_session_id = f"Session {len(chat_sessions) + 1}"
    chat_sessions[new_session_id] = []
    return JsonResponse({'status': 'success', 'message': f'{new_session_id} created', 'sessionId': new_session_id})

def landing_page(request):
    session_list = []
    for session in chat_sessions.keys():
        if '|' in session:
            name, session_id = session.split('|')
            session_list.append({'name': name, 'id': session_id})
        else:
            session_list.append({'name': session, 'id': 'default_id'})

    return render(request, 'landing_page.html', {'session_list': session_list})
