import os
import zipfile
from io import BytesIO

from app.config import settings

MAX_FILE_SIZE = 2 * 1024 * 1024
IGNORED_PREFIXES = ("node_modules/", ".git/", "dist/", "build/", "__pycache__/", ".next/", "venv/")


def is_probably_text(content: bytes) -> bool:
    if b"\x00" in content[:1024]:
        return False
    try:
        content.decode("utf-8")
        return True
    except UnicodeDecodeError:
        return False


def is_ignored_path(path: str) -> bool:
    normalized = path.replace(os.sep, "/")
    return any(normalized.startswith(prefix) for prefix in IGNORED_PREFIXES)


def project_storage_dir(project_id: str) -> str:
    return os.path.join(settings.upload_dir, project_id)


def safe_disk_path(project_id: str, relative_path: str) -> str:
    base_dir = os.path.abspath(project_storage_dir(project_id))
    target = os.path.abspath(os.path.join(base_dir, relative_path))

    if not target.startswith(base_dir):
        raise ValueError("Invalid file path")

    return target


def save_file_to_disk(project_id: str, relative_path: str, content: bytes) -> str:
    disk_path = safe_disk_path(project_id, relative_path)
    os.makedirs(os.path.dirname(disk_path), exist_ok=True)

    with open(disk_path, "wb") as f:
        f.write(content)

    return disk_path


def extract_zip_entries(zip_bytes: bytes) -> list[tuple[str, bytes]]:
    entries: list[tuple[str, bytes]] = []

    with zipfile.ZipFile(BytesIO(zip_bytes)) as archive:
        for info in archive.infolist():
            if info.is_dir():
                continue

            relative_path = info.filename
            if relative_path.startswith("/") or ".." in relative_path.split("/"):
                continue
            if is_ignored_path(relative_path):
                continue
            if info.file_size > MAX_FILE_SIZE:
                continue

            content = archive.read(info)
            if not is_probably_text(content):
                continue

            entries.append((relative_path, content))

    return entries
