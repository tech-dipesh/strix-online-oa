from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.database import chat_sessions_collection, files_collection, messages_collection
from app.models.chat import (
    ChatMessageCreate,
    ChatMessageInDB,
    ChatMessagePublic,
    ChatSessionCreate,
    ChatSessionInDB,
    ChatSessionPublic,
)
from app.models.user import UserPublic
from app.services.ai_client import get_chat_reply, get_user_provider
from app.services.context_retrieval import build_context_block, find_relevant_files
from app.services.project_access import get_owned_project

router = APIRouter(prefix="/projects/{project_id}/chat", tags=["chat"])

CHAT_SYSTEM_PROMPT = """You are a helpful assistant answering questions about a developer's codebase.
Use the file contents provided below as your primary source of truth. If the context doesn't contain
the answer, say so instead of guessing. Reference specific file paths when relevant.

{context}"""


@router.post("/sessions", response_model=ChatSessionPublic, status_code=status.HTTP_201_CREATED)
async def create_session(
    project_id: str,
    payload: ChatSessionCreate,
    current_user: UserPublic = Depends(get_current_user),
):
    await get_owned_project(project_id, current_user.id)

    session = ChatSessionInDB(project_id=project_id, user_id=current_user.id, title=payload.title)
    await chat_sessions_collection.insert_one(session.model_dump())
    return session.to_public()


@router.get("/sessions", response_model=list[ChatSessionPublic])
async def list_sessions(project_id: str, current_user: UserPublic = Depends(get_current_user)):
    await get_owned_project(project_id, current_user.id)

    cursor = chat_sessions_collection.find({"project_id": project_id}).sort("created_at", -1)
    sessions = await cursor.to_list(length=200)
    return [ChatSessionPublic(**s) for s in sessions]


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessagePublic])
async def list_messages(
    project_id: str,
    session_id: str,
    current_user: UserPublic = Depends(get_current_user),
):
    await get_owned_project(project_id, current_user.id)

    cursor = messages_collection.find({"session_id": session_id}).sort("created_at", 1)
    messages = await cursor.to_list(length=1000)
    return [ChatMessagePublic(**m) for m in messages]


@router.post("/sessions/{session_id}/messages", response_model=list[ChatMessagePublic])
async def send_message(
    project_id: str,
    session_id: str,
    payload: ChatMessageCreate,
    current_user: UserPublic = Depends(get_current_user),
):
    await get_owned_project(project_id, current_user.id)

    session = await chat_sessions_collection.find_one({"id": session_id, "project_id": project_id})
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")

    file_records = await files_collection.find({"project_id": project_id}).to_list(length=5000)
    if not file_records:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload files before starting a chat")

    files = []
    for record in file_records:
        with open(record["disk_path"], "r", encoding="utf-8") as f:
            files.append({"path": record["path"], "content": f.read()})

    relevant_files = find_relevant_files(files, payload.content)
    context_block = build_context_block(relevant_files)

    history_cursor = messages_collection.find({"session_id": session_id}).sort("created_at", 1)
    history = await history_cursor.to_list(length=50)

    provider = await get_user_provider(current_user.id)

    chat_messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT.format(context=context_block)}]
    for m in history:
        chat_messages.append({"role": m["role"], "content": m["content"]})
    chat_messages.append({"role": "user", "content": payload.content})

    reply_text = await get_chat_reply(provider, chat_messages)

    user_message = ChatMessageInDB(session_id=session_id, role="user", content=payload.content)
    assistant_message = ChatMessageInDB(
        session_id=session_id,
        role="assistant",
        content=reply_text,
        referenced_paths=[f["path"] for f in relevant_files],
    )

    await messages_collection.insert_many([user_message.model_dump(), assistant_message.model_dump()])

    return [user_message.to_public(), assistant_message.to_public()]
