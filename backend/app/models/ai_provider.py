from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, Field


class AIProviderInput(BaseModel):
    label: str = Field(min_length=1, max_length=50, description="e.g. OpenAI, LM Studio, Ollama")
    base_url: str = Field(min_length=1, max_length=300)
    api_key: str = Field(default="", max_length=500)
    model_name: str = Field(min_length=1, max_length=100)


class AIProviderPublic(BaseModel):
    id: str
    label: str
    base_url: str
    api_key_masked: str
    model_name: str
    updated_at: datetime


class AIProviderInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    label: str
    base_url: str
    api_key_encrypted: str
    model_name: str
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
