import difflib

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.database import diff_reviews_collection, files_collection
from app.models.diff_review import DiffReviewCreate, DiffReviewInDB, DiffReviewPublic
from app.models.user import UserPublic
from app.services.ai_client import get_user_provider, run_diff_review
from app.services.project_access import get_owned_project

router = APIRouter(prefix="/projects/{project_id}/diff-reviews", tags=["diff-reviews"])


@router.post("", response_model=DiffReviewPublic, status_code=status.HTTP_201_CREATED)
async def create_diff_review(
    project_id: str,
    payload: DiffReviewCreate,
    current_user: UserPublic = Depends(get_current_user),
):
    await get_owned_project(project_id, current_user.id)

    file_a = await files_collection.find_one({"id": payload.file_id_a, "project_id": project_id})
    file_b = await files_collection.find_one({"id": payload.file_id_b, "project_id": project_id})
    if not file_a or not file_b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or both files not found")

    with open(file_a["disk_path"], "r", encoding="utf-8") as f:
        content_a = f.read()
    with open(file_b["disk_path"], "r", encoding="utf-8") as f:
        content_b = f.read()

    diff_lines = difflib.unified_diff(
        content_a.splitlines(keepends=True),
        content_b.splitlines(keepends=True),
        fromfile=file_a["path"],
        tofile=file_b["path"],
    )
    diff_text = "".join(diff_lines)

    if not diff_text.strip():
        diff_text = "No differences found between the two files."

    provider = await get_user_provider(current_user.id)
    result = await run_diff_review(provider, diff_text, file_a["path"], file_b["path"])

    diff_review = DiffReviewInDB(
        project_id=project_id,
        user_id=current_user.id,
        file_path_a=file_a["path"],
        file_path_b=file_b["path"],
        diff_text=diff_text,
        summary=result["summary"],
        issues=result["issues"],
        recommendations=result["recommendations"],
    )
    await diff_reviews_collection.insert_one(diff_review.model_dump())
    return diff_review.to_public()


@router.get("", response_model=list[DiffReviewPublic])
async def list_diff_reviews(project_id: str, current_user: UserPublic = Depends(get_current_user)):
    await get_owned_project(project_id, current_user.id)

    cursor = diff_reviews_collection.find({"project_id": project_id}).sort("created_at", -1)
    reviews = await cursor.to_list(length=200)
    return [DiffReviewPublic(**r) for r in reviews]
