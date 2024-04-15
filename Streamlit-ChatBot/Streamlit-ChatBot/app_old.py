import streamlit as st
import os
import io
import boto3
from torchvision.io import read_image
from torchvision.utils import draw_bounding_boxes
import torch
import torchvision
import time

MAX_CHAT_SESSIONS = 10
MAX_MESSAGES_PER_SESSION = 40

if "chat_history" not in st.session_state:
    st.session_state.chat_history = {"Session 1": []}
    st.session_state.selected_session = "Session 1"

def get_next_session_name():
    existing_session_numbers = [int(name.split(" ")[-1]) for name in st.session_state.chat_history.keys()]
    for session_number in range(1, MAX_CHAT_SESSIONS + 1):
        if session_number not in existing_session_numbers:
            return f"Session {session_number}"
    return None

def create_new_chat_session():
    new_session_name = get_next_session_name()
    if new_session_name:
        st.session_state.chat_history[new_session_name] = []
        st.session_state.selected_session = new_session_name
        st.experimental_rerun()
    else:
        st.warning(f"Maximum number of chat sessions ({MAX_CHAT_SESSIONS}) reached.")

def delete_chat_session(session_name):
    if len(st.session_state.chat_history) > 1:
        if session_name in st.session_state.chat_history:
            del st.session_state.chat_history[session_name]
            available_sessions = list(st.session_state.chat_history.keys())
            st.session_state.selected_session = available_sessions[0]
            st.experimental_rerun()
    else:
        st.warning("Cannot delete the last chat session.")

chat_sessions = list(st.session_state.chat_history.keys())
selected_session = st.session_state.selected_session
selected_session_index = chat_sessions.index(selected_session) if selected_session in chat_sessions else 0
selected_session = st.sidebar.radio("Chat Sessions", options=chat_sessions, index=selected_session_index)

cats = st.multiselect(
    'Select the categories',
   ['cs', 'stat', 'econ'])

if st.sidebar.button("Create New Chat Session"):
    create_new_chat_session()

if st.sidebar.button("Delete Chat Session") and len(st.session_state.chat_history) > 1:
    delete_chat_session(selected_session)

st.title("💬 Chatbot")
st.caption("🚀 A streamlit chatbot")


startdate = st.date_input("Select start date", value=None)
enddate = st.date_input("Select end date", value=None)

for msg in st.session_state.chat_history[selected_session]:
    st.chat_message(msg["role"]).write(msg["content"])

if "awaiting_response" not in st.session_state:
    st.session_state.awaiting_response = False

if len(st.session_state.chat_history[selected_session]) < MAX_MESSAGES_PER_SESSION:
    if len(st.session_state.chat_history[selected_session]) % 2 == 0:
        prompt = st.chat_input(disabled=st.session_state.awaiting_response)
        
        if prompt:
            st.session_state.awaiting_response = True
            st.session_state.chat_history[selected_session].append({"role": "user", "content": prompt})
            st.chat_message("user").write(prompt)

            with st.spinner("Thinking..."):
                time.sleep(2)
            
            chatbot_response = "Chatbot response placeholder"
            st.session_state.chat_history[selected_session].append({"role": "assistant", "content": chatbot_response})
            st.chat_message("assistant").write(chatbot_response)
            
            st.session_state.awaiting_response = False
else:
    st.warning(f"Maximum number of messages ({MAX_MESSAGES_PER_SESSION}) reached for this session.")