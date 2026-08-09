from fastapi import HTTPException, status

from app.database import projects_collection


async def get_owned_project(project_id: str, user_id: str) -> dict:
    project = await projects_collection.find_one({"id": project_id, "owner_id": user_id})
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project
