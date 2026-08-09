from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field

DocType = Literal["readme", "setup", "api"]


class GeneratedDocCreate(BaseModel):
    doc_type: DocType


class GeneratedDocPublic(BaseModel):
    id: str
    project_id: str
    doc_type: DocType
    content: str
    created_at: datetime


class GeneratedDocInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    project_id: str
    user_id: str
    doc_type: DocType
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def to_public(self) -> GeneratedDocPublic:
        return GeneratedDocPublic(
            id=self.id,
            project_id=self.project_id,
            doc_type=self.doc_type,
            content=self.content,
            created_at=self.created_at,
        )
