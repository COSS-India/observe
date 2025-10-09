from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.core.config import settings

# Password hashing
# Configure bcrypt to truncate passwords instead of raising errors
pwd_context = CryptContext(
    schemes=["bcrypt"], 
    deprecated="auto",
    bcrypt__truncate_error=False  # Don't raise error for passwords > 72 bytes
)


def validate_password_length(password: str) -> tuple[bool, str]:
    """
    Validate password length for bcrypt compatibility
    Returns: (is_valid, error_message)
    """
    if not password:
        return False, "Password cannot be empty"
    
    # Check byte length (not character length) for bcrypt compatibility
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        return False, f"Password cannot be longer than 72 bytes (current: {len(password_bytes)} bytes). Please use a shorter password."
    
    return True, ""


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    # Ensure password is properly encoded and truncated to 72 bytes for bcrypt compatibility
    if isinstance(plain_password, str):
        # Encode to bytes to get accurate byte count, then truncate
        password_bytes = plain_password.encode('utf-8')
        if len(password_bytes) > 72:
            # Truncate to 72 bytes and decode back to string
            truncated_bytes = password_bytes[:72]
            truncated_password = truncated_bytes.decode('utf-8', errors='ignore')
        else:
            truncated_password = plain_password
    else:
        truncated_password = str(plain_password)[:72]
    
    return pwd_context.verify(truncated_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    # Ensure password is properly encoded and truncated to 72 bytes for bcrypt compatibility
    if isinstance(password, str):
        # Encode to bytes to get accurate byte count, then truncate
        password_bytes = password.encode('utf-8')
        if len(password_bytes) > 72:
            # Truncate to 72 bytes and decode back to string
            truncated_bytes = password_bytes[:72]
            truncated_password = truncated_bytes.decode('utf-8', errors='ignore')
        else:
            truncated_password = password
    else:
        truncated_password = str(password)[:72]
    
    return pwd_context.hash(truncated_password)


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
