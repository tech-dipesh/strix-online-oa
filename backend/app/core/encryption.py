import base64
import hashlib

from cryptography.fernet import Fernet

from app.config import settings


def _get_fernet() -> Fernet:
    digest = hashlib.sha256(settings.jwt_secret.encode()).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def encrypt_text(plain_text: str) -> str:
    return _get_fernet().encrypt(plain_text.encode()).decode()


def decrypt_text(cipher_text: str) -> str:
    return _get_fernet().decrypt(cipher_text.encode()).decode()


def mask_secret(secret: str) -> str:
    if len(secret) <= 4:
        return "****"
    return f"{'*' * (len(secret) - 4)}{secret[-4:]}"
