$(document).ready(function() {
    initChatSessions();
    loadLastActiveSession();

    $('#chatForm').off().on('submit', function(event) {
        event.preventDefault();
        sendMessage();
    });

    $('.minimize-btn').click(function() {
        $('.sidebar').toggleClass('minimized');
        $(this).html($('.sidebar').hasClass('minimized') ? '&#8250;' : '&#8249;');
        $('.sidebar > *:not(.minimize-btn)').toggle();
    });

    $('.create-chat-btn').click(function() {
        createChatSession();
    });

    $(document).on('click', '.chat-sessions li', function() {
        switchChatSession(this);
    }).on('click', '.delete-chat-btn', function(e) {
        e.stopPropagation();
        deleteChatSession($(this).closest('li').data('session-id'));
    }).on('click', '.rename-chat-btn', function(e) {
        e.stopPropagation();
        renameChatSession($(this).closest('li'));
    });
});

function initChatSessions() {
    var sessions = getCookie('chatSessions');
    if (sessions) {
        $('.chat-sessions').empty();
        sessions.split(',').forEach(function(session) {
            if (session.trim() !== "") {
                var sessionName = session.split('|')[0];
                var sessionId = session.split('|')[1];
                var sessionElement = $('<li>').data('session-id', sessionId)
                    .append($('<span class="session-name">').text(truncateWithEllipsis(sessionName, 15)))
                    .append($('<span class="delete-chat-btn">🗑️</span>'))
                    .append($('<span class="rename-chat-btn">✏️</span>'));
                $('.chat-sessions').append(sessionElement);
            }
        });
    } else {
        var defaultSessionId = generateUniqueSessionId();
        var defaultSessionElement = $('<li>').data('session-id', defaultSessionId).addClass('active-session')
            .append($('<span class="session-name">').text('New Chat'))
            .append($('<span class="delete-chat-btn">🗑️</span>'))
            .append($('<span class="rename-chat-btn">✏️</span>'));
        $('.chat-sessions').append(defaultSessionElement);
        setCookie('chatSessions', 'New Chat|' + defaultSessionId, 7);
        setCookie('lastActiveSession', 'New Chat', 7);
    }
}

function loadLastActiveSession() {
    var lastActiveSessionId = getCookie('lastActiveSession');
    if (lastActiveSessionId) {
        var lastSessionElement = $(`.chat-sessions li[data-session-id="${lastActiveSessionId}"]`).get(0);
        if (lastSessionElement) {
            switchChatSession(lastSessionElement);
        } else {
            initChatSessions();
            lastSessionElement = $(`.chat-sessions li[data-session-id="${lastActiveSessionId}"]`).get(0);
            if (lastSessionElement) {
                switchChatSession(lastSessionElement);
            } else {
                var chatSessions = getCookie('chatSessions').split(',');
                var lastActiveSession = chatSessions.find(session => session.split('|')[1] === lastActiveSessionId);
                if (lastActiveSession) {
                    var lastActiveSessionName = lastActiveSession.split('|')[0];
                    var existingSessionElement = $(`.chat-sessions li:contains("${lastActiveSessionName}")`).filter(function() {
                        return $(this).data('session-id') === lastActiveSessionId;
                    }).get(0);
                    if (!existingSessionElement) {
                        var newSessionElement = $('<li>').text(lastActiveSessionName).data('session-id', lastActiveSessionId).append($('<span class="delete-chat-btn">🗑️</span>')).append($('<span class="rename-chat-btn">✏️</span>'));
                        $('.chat-sessions').append(newSessionElement);
                        switchChatSession(newSessionElement[0]);
                    } else {
                        switchChatSession(existingSessionElement);
                    }
                } else {
                    switchChatSession($('.chat-sessions li:first-child')[0]);
                }
            }
        }
    } else {
        switchChatSession($('.chat-sessions li:first-child')[0]);
    }
}

function sendMessage() {
    var message = $('#msg').val().trim();
    if (!message) return;
    var chatContainer = $('#chatContainer');
    appendMessage('user', message);
    $('#msg').val('');

    var csrftoken = getCookie('csrftoken');
    var activeSession = $('.chat-sessions .active-session').data('session-id');

    $.ajax({
        url: '/record_click/',
        method: 'POST',
        headers: {'X-CSRFToken': csrftoken},
        data: {
            'message': message,
            'session_id': activeSession,
        },
        success: function(response) {
            appendMessage('bot', response.message);
            var chatHistory = getCookie('chatHistory_' + activeSession) || '';
            chatHistory += 'user|' + message + ',bot|' + response.message + ',';
            setCookie('chatHistory_' + activeSession, chatHistory, 7);
        }
    });
}

function createChatSession() {
    var newSessionId = generateUniqueSessionId();
    var newSessionElement = $('<li>').data('session-id', newSessionId)
        .append($('<span class="session-name">').text('New Chat'))
        .append($('<span class="delete-chat-btn">🗑️</span>'))
        .append($('<span class="rename-chat-btn">✏️</span>'));
    $('.chat-sessions').append(newSessionElement);

    var existingSessions = getCookie('chatSessions');
    var updatedSessions = existingSessions ? existingSessions + ',' + 'New Chat|' + newSessionId : 'New Chat|' + newSessionId;
    setCookie('chatSessions', updatedSessions, 7);

    switchChatSession(newSessionElement[0]);
}

function switchChatSession(sessionElement) {
    $('.chat-sessions li').removeClass('active-session');
    $(sessionElement).addClass('active-session');
    var sessionId = $(sessionElement).data('session-id');
    localStorage.setItem('lastActiveSession', sessionId);
    $('#chatContainer').empty();

    var chatHistory = getCookie('chatHistory_' + sessionId);
    if (chatHistory) {
        chatHistory.split(',').forEach(function(message) {
            if (message.trim() !== '') {
                var sender = message.split('|')[0];
                var messageText = message.split('|')[1];
                appendMessage(sender, messageText);
            }
        });
    } else {
        $.ajax({
            url: '/get_chat_session/',
            method: 'GET',
            data: {'session_id': sessionId},
            success: function(response) {
                response.chat_history.forEach(function(message) {
                    appendMessage(message.sender, message.message);
                });
            }
        });
    }

    setCookie('lastActiveSession', sessionId, 7);
}

function appendMessage(sender, message) {
    var chatContainer = $('#chatContainer');
    var messageDiv = $('<div>').addClass(sender + '-message').text(truncateWithEllipsis(message, 100));
    chatContainer.append(messageDiv);
}

function deleteChatSession(sessionId) {
    var chatSessions = getCookie('chatSessions').split(',');
    var updatedSessions = chatSessions.filter(s => s.split('|')[1] !== sessionId);

    if (updatedSessions.length === 0) {
        var defaultSessionId = generateUniqueSessionId();
        var defaultSessionElement = $('<li>').text('New Chat').data('session-id', defaultSessionId).addClass('active-session').append($('<span class="delete-chat-btn">🗑️</span>')).append($('<span class="rename-chat-btn">✏️</span>'));
        $('.chat-sessions').empty().append(defaultSessionElement);
        setCookie('chatSessions', 'New Chat|' + defaultSessionId, 7);
        setCookie('lastActiveSession', 'New Chat', 7);
        switchChatSession(defaultSessionElement[0]);
    } else {
        setCookie('chatSessions', updatedSessions.join(','), 7);
        $(`.chat-sessions li[data-session-id="${sessionId}"]`).remove();
        initChatSessions();
        switchChatSession($('.chat-sessions li:first-child')[0]);
    }
}

function renameChatSession(sessionElement) {
    var currentName = sessionElement.text().trim().replace(/🗑️|✏️/g, '');
    var newName = prompt('Rename chat session:', currentName);
    if (newName !== null && newName !== currentName) {
        var sessionId = sessionElement.data('session-id');
        var chatSessions = getCookie('chatSessions').split(',');
        var updatedSessions = chatSessions.map(s => {
            if (s.split('|')[1] === sessionId) {
                return truncateWithEllipsis(newName, 15) + '|' + sessionId;
            }
            return s;
        }).join(',');
        setCookie('chatSessions', updatedSessions, 7);
        sessionElement.text(truncateWithEllipsis(newName, 15));
        initChatSessions();
    }
}

function generateUniqueSessionId() {
    var timestamp = new Date().getTime();
    var randomNumber = Math.floor(Math.random() * 1000000);
    return 'session-' + timestamp + '-' + randomNumber;
}

function truncateWithEllipsis(str, maxLength) {
    if (str.length > maxLength) {
        return str.substr(0, maxLength - 3) + '...';
    }
    return str;
}

function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function deleteCookie(name) {   
    document.cookie = name+'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}