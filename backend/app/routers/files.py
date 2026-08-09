from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.core.deps import get_current_user
from app.database import files_collection
from app.models.file import FileContent, FileInDB, FilePublic
from app.models.user import UserPublic
from app.services.file_storage import (
    extract_zip_entries,
    is_ignored_path,
    is_probably_text,
    save_file_to_disk,
    MAX_FILE_SIZE,
)
from app.services.project_access import get_owned_project

router = APIRouter(prefix="/projects/{project_id}/files", tags=["files"])


async def store_entry(project_id: str, relative_path: str, content: bytes) -> FilePublic:
    disk_path = save_file_to_disk(project_id, relative_path, content)
    file_record = FileInDB(
        project_id=project_id,
        path=relative_path,
        size=len(content),
        disk_path=disk_path,
    )
    await files_collection.insert_one(file_record.model_dump())
    return file_record.to_public()


@router.post("/upload-zip", response_model=list[FilePublic], status_code=status.HTTP_201_CREATED)
async def upload_zip(
    project_id: str,
    file: UploadFile,
    current_user: UserPublic = Depends(get_current_user),
):
    await get_owned_project(project_id, current_user.id)

    zip_bytes = await file.read()
    try:
        entries = extract_zip_entries(zip_bytes)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid zip file")

    if not entries:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No readable text files in zip")

    stored = [await store_entry(project_id, path, content) for path, content in entries]
    return stored


@router.post("/upload", response_model=list[FilePublic], status_code=status.HTTP_201_CREATED)
async def upload_files(
    project_id: str,
    files: list[UploadFile],
    current_user: UserPublic = Depends(get_current_user),
):
    await get_owned_project(project_id, current_user.id)

    stored: list[FilePublic] = []
    for upload in files:
        content = await upload.read()
        relative_path = upload.filename or "untitled"

        if is_ignored_path(relative_path) or len(content) > MAX_FILE_SIZE or not is_probably_text(content):
            continue

        stored.append(await store_entry(project_id, relative_path, content))

    if not stored:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No readable text files uploaded")

    return stored


@router.get("", response_model=list[FilePublic])
async def list_files(project_id: str, current_user: UserPublic = Depends(get_current_user)):
    await get_owned_project(project_id, current_user.id)

    cursor = files_collection.find({"project_id": project_id}).sort("path", 1)
    files = await cursor.to_list(length=5000)
    return [FilePublic(**f) for f in files]


@router.get("/{file_id}/content", response_model=FileContent)
async def get_file_content(
    project_id: str,
    file_id: str,
    current_user: UserPublic = Depends(get_current_user),
):
    await get_owned_project(project_id, current_user.id)

    file_record = await files_collection.find_one({"id": file_id, "project_id": project_id})
    if not file_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    with open(file_record["disk_path"], "r", encoding="utf-8") as f:
        content = f.read()

    return FileContent(id=file_record["id"], path=file_record["path"], content=content)
