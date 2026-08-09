from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)


class ProjectPublic(BaseModel):
    id: str
    name: str
    description: str
    owner_id: str
    created_at: datetime


class ProjectInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    description: str
    owner_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def to_public(self) -> ProjectPublic:
        return ProjectPublic(
            id=self.id,
            name=self.name,
            description=self.description,
            owner_id=self.owner_id,
            created_at=self.created_at,
        )
