from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.database import files_collection, generated_docs_collection
from app.models.generated_doc import GeneratedDocCreate, GeneratedDocInDB, GeneratedDocPublic
from app.models.user import UserPublic
from app.services.ai_client import generate_doc, get_user_provider
from app.services.project_access import get_owned_project

router = APIRouter(prefix="/projects/{project_id}/docs", tags=["docs"])


@router.post("", response_model=GeneratedDocPublic, status_code=status.HTTP_201_CREATED)
async def create_doc(
    project_id: str,
    payload: GeneratedDocCreate,
    current_user: UserPublic = Depends(get_current_user),
):
    await get_owned_project(project_id, current_user.id)

    file_records = await files_collection.find({"project_id": project_id}).to_list(length=5000)
    if not file_records:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload files before generating docs")

    files = []
    for record in file_records:
        with open(record["disk_path"], "r", encoding="utf-8") as f:
            files.append({"path": record["path"], "content": f.read()})

    provider = await get_user_provider(current_user.id)
    content = await generate_doc(provider, payload.doc_type, files)

    doc = GeneratedDocInDB(
        project_id=project_id,
        user_id=current_user.id,
        doc_type=payload.doc_type,
        content=content,
    )
    await generated_docs_collection.insert_one(doc.model_dump())
    return doc.to_public()


@router.get("", response_model=list[GeneratedDocPublic])
async def list_docs(project_id: str, current_user: UserPublic = Depends(get_current_user)):
    await get_owned_project(project_id, current_user.id)

    cursor = generated_docs_collection.find({"project_id": project_id}).sort("created_at", -1)
    docs = await cursor.to_list(length=200)
    return [GeneratedDocPublic(**d) for d in docs]
