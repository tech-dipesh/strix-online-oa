from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, Field


class FilePublic(BaseModel):
    id: str
    project_id: str
    path: str
    size: int
    created_at: datetime


class FileInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    project_id: str
    path: str
    size: int
    disk_path: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def to_public(self) -> FilePublic:
        return FilePublic(
            id=self.id,
            project_id=self.project_id,
            path=self.path,
            size=self.size,
            created_at=self.created_at,
        )


class FileContent(BaseModel):
    id: str
    path: str
    content: str
