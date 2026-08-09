import shutil

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.database import files_collection, projects_collection
from app.models.project import ProjectCreate, ProjectInDB, ProjectPublic
from app.models.user import UserPublic
from app.services.file_storage import project_storage_dir

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectPublic, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    current_user: UserPublic = Depends(get_current_user),
):
    project = ProjectInDB(
        name=payload.name,
        description=payload.description,
        owner_id=current_user.id,
    )
    await projects_collection.insert_one(project.model_dump())
    return project.to_public()


@router.get("", response_model=list[ProjectPublic])
async def list_projects(current_user: UserPublic = Depends(get_current_user)):
    cursor = projects_collection.find({"owner_id": current_user.id}).sort("created_at", -1)
    projects = await cursor.to_list(length=200)
    return [ProjectPublic(**project) for project in projects]


@router.get("/{project_id}", response_model=ProjectPublic)
async def get_project(project_id: str, current_user: UserPublic = Depends(get_current_user)):
    project = await projects_collection.find_one({"id": project_id, "owner_id": current_user.id})
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return ProjectPublic(**project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: str, current_user: UserPublic = Depends(get_current_user)):
    result = await projects_collection.delete_one({"id": project_id, "owner_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    await files_collection.delete_many({"project_id": project_id})
    shutil.rmtree(project_storage_dir(project_id), ignore_errors=True)
    return None
