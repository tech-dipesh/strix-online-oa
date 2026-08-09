from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, Field

from app.models.review import ReviewIssue


class DiffReviewCreate(BaseModel):
    file_id_a: str
    file_id_b: str


class DiffReviewPublic(BaseModel):
    id: str
    project_id: str
    file_path_a: str
    file_path_b: str
    diff_text: str
    summary: str
    issues: list[ReviewIssue]
    recommendations: list[str]
    created_at: datetime


class DiffReviewInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    project_id: str
    user_id: str
    file_path_a: str
    file_path_b: str
    diff_text: str
    summary: str
    issues: list[ReviewIssue]
    recommendations: list[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def to_public(self) -> DiffReviewPublic:
        return DiffReviewPublic(
            id=self.id,
            project_id=self.project_id,
            file_path_a=self.file_path_a,
            file_path_b=self.file_path_b,
            diff_text=self.diff_text,
            summary=self.summary,
            issues=self.issues,
            recommendations=self.recommendations,
            created_at=self.created_at,
        )
