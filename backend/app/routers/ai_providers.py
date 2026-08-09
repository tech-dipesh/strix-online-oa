from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.core.encryption import decrypt_text, encrypt_text, mask_secret
from app.database import ai_providers_collection
from app.models.ai_provider import AIProviderInDB, AIProviderInput, AIProviderPublic
from app.models.user import UserPublic

router = APIRouter(prefix="/ai-providers", tags=["ai-providers"])


def to_public(record: dict) -> AIProviderPublic:
    return AIProviderPublic(
        id=record["id"],
        label=record["label"],
        base_url=record["base_url"],
        api_key_masked=mask_secret(decrypt_text(record["api_key_encrypted"])) if record["api_key_encrypted"] else "",
        model_name=record["model_name"],
        updated_at=record["updated_at"],
    )


@router.put("", response_model=AIProviderPublic)
async def save_provider(
    payload: AIProviderInput,
    current_user: UserPublic = Depends(get_current_user),
):
    existing = await ai_providers_collection.find_one({"user_id": current_user.id})

    if payload.api_key:
        api_key_encrypted = encrypt_text(payload.api_key)
    elif existing:
        api_key_encrypted = existing["api_key_encrypted"]
    else:
        api_key_encrypted = ""

    record = AIProviderInDB(
        user_id=current_user.id,
        label=payload.label,
        base_url=payload.base_url.rstrip("/"),
        api_key_encrypted=api_key_encrypted,
        model_name=payload.model_name,
    )

    await ai_providers_collection.replace_one(
        {"user_id": current_user.id},
        record.model_dump(),
        upsert=True,
    )
    return to_public(record.model_dump())


@router.get("", response_model=AIProviderPublic | None)
async def get_provider(current_user: UserPublic = Depends(get_current_user)):
    record = await ai_providers_collection.find_one({"user_id": current_user.id})
    if not record:
        return None
    return to_public(record)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_provider(current_user: UserPublic = Depends(get_current_user)):
    result = await ai_providers_collection.delete_one({"user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No provider configured")
    return None
