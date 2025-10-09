from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.core.config import settings
import hashlib
import secrets
import string


def generate_simple_password() -> str:
    """Generate a simple password for new users"""
    # Generate a simple 6-character password
    alphabet = string.ascii_letters + string.digits
    password = ''.join(secrets.choice(alphabet) for _ in range(6))
    print(f"[DEBUG] Generated simple password: '{password}'")
    return password


def get_password_hash(password: str) -> str:
    """Simple password hashing using SHA-256"""
    print(f"[DEBUG] Hashing password: '{password}'")
    # Use SHA-256 with a simple salt
    salt = "simple_salt_2025"  # Simple salt
    password_with_salt = password + salt
    hash_result = hashlib.sha256(password_with_salt.encode()).hexdigest()
    print(f"[DEBUG] Password hashed successfully: {hash_result[:50]}...")
    return hash_result


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Simple password verification"""
    print(f"[DEBUG] Verifying password: '{plain_password}'")
    # Hash the plain password and compare
    expected_hash = get_password_hash(plain_password)
    is_valid = expected_hash == hashed_password
    print(f"[DEBUG] Password verification result: {is_valid}")
    return is_valid


def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str):
    """Verify JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
