from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.database import files_collection, reviews_collection
from app.models.review import ReviewCreate, ReviewInDB, ReviewPublic
from app.models.user import UserPublic
from app.services.ai_client import get_user_provider, run_review
from app.services.project_access import get_owned_project

router = APIRouter(prefix="/projects/{project_id}/reviews", tags=["reviews"])


@router.post("", response_model=ReviewPublic, status_code=status.HTTP_201_CREATED)
async def create_review(
    project_id: str,
    payload: ReviewCreate,
    current_user: UserPublic = Depends(get_current_user),
):
    await get_owned_project(project_id, current_user.id)

    query: dict = {"project_id": project_id}
    if payload.file_ids:
        query["id"] = {"$in": payload.file_ids}

    file_records = await files_collection.find(query).to_list(length=5000)
    if not file_records:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files found to review")

    files_for_review = []
    for record in file_records:
        with open(record["disk_path"], "r", encoding="utf-8") as f:
            files_for_review.append({"path": record["path"], "content": f.read()})

    provider = await get_user_provider(current_user.id)
    result = await run_review(provider, payload.review_type, files_for_review)

    review = ReviewInDB(
        project_id=project_id,
        user_id=current_user.id,
        review_type=payload.review_type,
        reviewed_paths=[f["path"] for f in files_for_review],
        summary=result["summary"],
        issues=result["issues"],
        recommendations=result["recommendations"],
    )
    await reviews_collection.insert_one(review.model_dump())
    return review.to_public()


@router.get("", response_model=list[ReviewPublic])
async def list_reviews(
    project_id: str,
    review_type: str | None = None,
    search: str | None = None,
    current_user: UserPublic = Depends(get_current_user),
):
    await get_owned_project(project_id, current_user.id)

    query: dict = {"project_id": project_id}
    if review_type:
        query["review_type"] = review_type
    if search:
        query["$or"] = [
            {"summary": {"$regex": search, "$options": "i"}},
            {"reviewed_paths": {"$regex": search, "$options": "i"}},
        ]

    cursor = reviews_collection.find(query).sort("created_at", -1)
    reviews = await cursor.to_list(length=500)
    return [ReviewPublic(**r) for r in reviews]


@router.get("/{review_id}", response_model=ReviewPublic)
async def get_review(
    project_id: str,
    review_id: str,
    current_user: UserPublic = Depends(get_current_user),
):
    await get_owned_project(project_id, current_user.id)

    review = await reviews_collection.find_one({"id": review_id, "project_id": project_id})
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return ReviewPublic(**review)
