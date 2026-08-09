from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field

ReviewType = Literal["security", "performance", "quality"]
Severity = Literal["critical", "high", "medium", "low"]


class ReviewCreate(BaseModel):
    review_type: ReviewType
    file_ids: list[str] | None = None


class ReviewIssue(BaseModel):
    title: str
    description: str
    severity: Severity
    file_path: str
    line: int | None = None


class ReviewPublic(BaseModel):
    id: str
    project_id: str
    review_type: ReviewType
    reviewed_paths: list[str]
    summary: str
    issues: list[ReviewIssue]
    recommendations: list[str]
    created_at: datetime


class ReviewInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    project_id: str
    user_id: str
    review_type: ReviewType
    reviewed_paths: list[str]
    summary: str
    issues: list[ReviewIssue]
    recommendations: list[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def to_public(self) -> ReviewPublic:
        return ReviewPublic(
            id=self.id,
            project_id=self.project_id,
            review_type=self.review_type,
            reviewed_paths=self.reviewed_paths,
            summary=self.summary,
            issues=self.issues,
            recommendations=self.recommendations,
            created_at=self.created_at,
        )
