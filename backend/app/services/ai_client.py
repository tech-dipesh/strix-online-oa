import json
from typing import Literal

from fastapi import HTTPException, status
from openai import AsyncOpenAI

from app.core.encryption import decrypt_text
from app.database import ai_providers_collection

ReviewType = Literal["security", "performance", "quality"]

REVIEW_FOCUS: dict[ReviewType, str] = {
    "security": "Hardcoded credentials, authentication issues, input validation, injection risks.",
    "performance": "Slow operations, inefficient rendering, unnecessary database queries.",
    "quality": "Naming, structure, readability, maintainability.",
}

MAX_CHARS_PER_FILE = 6000

SYSTEM_PROMPT = """You are a senior software engineer performing a code review.
Focus area for this review: {focus}

Review the provided files and respond with ONLY a single JSON object, no markdown fences, matching exactly this shape:
{{
  "summary": "a short high-level overview of what you found",
  "issues": [
    {{
      "title": "short issue title",
      "description": "what the problem is and why it matters",
      "severity": "critical" | "high" | "medium" | "low",
      "file_path": "path of the file the issue is in",
      "line": null or a line number if you can identify one
    }}
  ],
  "recommendations": ["short actionable suggestion", "..."]
}}

If you find no issues, return an empty issues array. Do not include any text outside the JSON object."""


async def get_user_provider(user_id: str) -> dict:
    record = await ai_providers_collection.find_one({"user_id": user_id})
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configure an AI provider before requesting a review",
        )

    return {
        "base_url": record["base_url"],
        "api_key": decrypt_text(record["api_key_encrypted"]) if record["api_key_encrypted"] else "not-needed",
        "model_name": record["model_name"],
    }


def build_user_prompt(files: list[dict]) -> str:
    sections = []
    for f in files:
        truncated = f["content"][:MAX_CHARS_PER_FILE]
        sections.append(f"--- FILE: {f['path']} ---\n{truncated}")
    return "\n\n".join(sections)


def parse_review_json(raw_text: str) -> dict:
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI provider returned a response that could not be parsed",
        )

    parsed.setdefault("summary", "")
    parsed.setdefault("issues", [])
    parsed.setdefault("recommendations", [])
    return parsed


async def run_review(provider: dict, review_type: ReviewType, files: list[dict]) -> dict:
    client = AsyncOpenAI(base_url=provider["base_url"], api_key=provider["api_key"])

    system_prompt = SYSTEM_PROMPT.format(focus=REVIEW_FOCUS[review_type])
    user_prompt = build_user_prompt(files)

    try:
        response = await client.chat.completions.create(
            model=provider["model_name"],
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider request failed: {error}",
        )

    raw_text = response.choices[0].message.content or ""
    return parse_review_json(raw_text)


async def get_chat_reply(provider: dict, messages: list[dict]) -> str:
    client = AsyncOpenAI(base_url=provider["base_url"], api_key=provider["api_key"])

    try:
        response = await client.chat.completions.create(
            model=provider["model_name"],
            messages=messages,
            temperature=0.3,
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider request failed: {error}",
        )

    return response.choices[0].message.content or ""


DIFF_SYSTEM_PROMPT = """You are a senior engineer reviewing a code change (a unified diff between two files).
Assess the risk and quality of this change.

Respond with ONLY a single JSON object, no markdown fences, matching exactly this shape:
{
  "summary": "a short high-level overview of what changed and its impact",
  "issues": [
    {
      "title": "short issue title",
      "description": "what the problem is and why it matters",
      "severity": "critical" | "high" | "medium" | "low",
      "file_path": "path of the file the issue is in",
      "line": null or a line number if you can identify one
    }
  ],
  "recommendations": ["short actionable suggestion", "..."]
}

If the change looks safe and well-made, return an empty issues array. Do not include any text outside the JSON object."""


async def run_diff_review(provider: dict, diff_text: str, file_path_a: str, file_path_b: str) -> dict:
    client = AsyncOpenAI(base_url=provider["base_url"], api_key=provider["api_key"])

    user_prompt = f"Comparing {file_path_a} -> {file_path_b}:\n\n{diff_text[:12000]}"

    try:
        response = await client.chat.completions.create(
            model=provider["model_name"],
            messages=[
                {"role": "system", "content": DIFF_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider request failed: {error}",
        )

    raw_text = response.choices[0].message.content or ""
    return parse_review_json(raw_text)


DOC_SYSTEM_PROMPTS = {
    "readme": "Generate a clear, professional README.md for this project based on its source files. Include a project overview, features, and usage. Respond with only the markdown content, no commentary outside it.",
    "setup": "Generate a SETUP.md guide for this project based on its source files: prerequisites, installation steps, environment variables if any are referenced in the code, and how to run it. Respond with only the markdown content, no commentary outside it.",
    "api": "Generate API documentation in markdown for this project based on its source files: list endpoints/functions you can identify, their purpose, parameters, and responses. Respond with only the markdown content, no commentary outside it.",
}


async def generate_doc(provider: dict, doc_type: str, files: list[dict]) -> str:
    client = AsyncOpenAI(base_url=provider["base_url"], api_key=provider["api_key"])

    system_prompt = DOC_SYSTEM_PROMPTS[doc_type]
    user_prompt = build_user_prompt(files)

    try:
        response = await client.chat.completions.create(
            model=provider["model_name"],
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider request failed: {error}",
        )

    return response.choices[0].message.content or ""
