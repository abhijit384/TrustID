import hashlib
import os

def calculate_sha256_from_bytes(data: bytes) -> str:
    """Calculate SHA-256 hex digest from raw bytes."""
    hasher = hashlib.sha256()
    hasher.update(data)
    return hasher.hexdigest()

def calculate_sha256_from_file(file_path: str) -> str:
    """Calculate SHA-256 hex digest from a file path."""
    if not os.path.exists(file_path):
        return ""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def verify_document_integrity(file_path: str, expected_hash: str) -> bool:
    """Verify that current file hash strictly matches the stored hash."""
    if not expected_hash or not os.path.exists(file_path):
        return False
    current_hash = calculate_sha256_from_file(file_path)
    return current_hash.lower() == expected_hash.lower()
