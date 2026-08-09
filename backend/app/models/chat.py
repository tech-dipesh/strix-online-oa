from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field

Role = Literal["user", "assistant"]


class ChatSessionCreate(BaseModel):
    title: str = Field(default="New chat", max_length=100)


class ChatSessionPublic(BaseModel):
    id: str
    project_id: str
    title: str
    created_at: datetime


class ChatSessionInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    project_id: str
    user_id: str
    title: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def to_public(self) -> ChatSessionPublic:
        return ChatSessionPublic(
            id=self.id, project_id=self.project_id, title=self.title, created_at=self.created_at
        )


class ChatMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class ChatMessagePublic(BaseModel):
    id: str
    session_id: str
    role: Role
    content: str
    referenced_paths: list[str] = []
    created_at: datetime


class ChatMessageInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    session_id: str
    role: Role
    content: str
    referenced_paths: list[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def to_public(self) -> ChatMessagePublic:
        return ChatMessagePublic(
            id=self.id,
            session_id=self.session_id,
            role=self.role,
            content=self.content,
            referenced_paths=self.referenced_paths,
            created_at=self.created_at,
        )
