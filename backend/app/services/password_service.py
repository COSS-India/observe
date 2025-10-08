import secrets
import string
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.utils.security import get_password_hash, verify_password
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class PasswordService:
    """Service for managing passwords and password resets"""
    
    def __init__(self):
        self.temp_password_length = 12
        self.reset_token_length = 32
        self.temp_password_expiry_hours = 24
        self.reset_token_expiry_hours = 1
    
    def generate_temp_password(self) -> str:
        """Generate a secure temporary password"""
        # Use a mix of letters, digits, and symbols
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(alphabet) for _ in range(self.temp_password_length))
        
        # Ensure password has at least one of each type
        if not any(c.islower() for c in password):
            password = password[:-1] + secrets.choice(string.ascii_lowercase)
        if not any(c.isupper() for c in password):
            password = password[:-1] + secrets.choice(string.ascii_uppercase)
        if not any(c.isdigit() for c in password):
            password = password[:-1] + secrets.choice(string.digits)
        
        # Ensure password is not longer than 72 bytes for bcrypt compatibility
        password = password[:72]
        
        return password
    
    def generate_reset_token(self) -> str:
        """Generate a secure password reset token"""
        return secrets.token_urlsafe(self.reset_token_length)
    
    def create_user_with_temp_password(self, db: Session, user_data: dict) -> tuple[User, str]:
        """Create a new user with a temporary password"""
        
        # Generate temporary password
        temp_password = self.generate_temp_password()
        password_hash = get_password_hash(temp_password)
        
        # Create user with temporary password
        user = User(
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            email=user_data['email'],
            password_hash=password_hash,
            role=user_data.get('role', 'customer'),
            org_type=user_data.get('org_type'),
            org_name=user_data.get('org_name'),
            org_details=user_data.get('org_details'),
            tnc_url=user_data.get('tnc_url'),
            is_fresh=True,
            is_profile_updated=False,
            is_existing_user=False,
            is_external=False,
            # Add password reset fields
            temp_password_expires_at=datetime.now(timezone.utc) + timedelta(hours=self.temp_password_expiry_hours),
            password_reset_token=None,
            password_reset_expires_at=None
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        logger.info(f"Created user {user.email} with temporary password")
        return user, temp_password
    
    def verify_temp_password(self, db: Session, email: str, password: str) -> Optional[User]:
        """Verify temporary password and check if user needs to change it"""
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None
        
        # Check if password is correct
        if not verify_password(password, user.password_hash):
            return None
        
        # Check if temporary password has expired
        if hasattr(user, 'temp_password_expires_at') and user.temp_password_expires_at:
            if datetime.now(timezone.utc) > user.temp_password_expires_at:
                logger.warning(f"Temporary password expired for user {email}")
                return None
        
        return user
    
    def is_password_change_required(self, user: User) -> bool:
        """Check if user needs to change their password"""
        
        # Check if user has temporary password that hasn't expired
        if hasattr(user, 'temp_password_expires_at') and user.temp_password_expires_at:
            if datetime.now(timezone.utc) <= user.temp_password_expires_at:
                return True
        
        # Check if user is fresh (first time login)
        if user.is_fresh:
            return True
        
        return False
    
    def create_password_reset_token(self, db: Session, email: str) -> Optional[str]:
        """Create a password reset token for user"""
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None
        
        # Generate reset token
        reset_token = self.generate_reset_token()
        
        # Update user with reset token
        user.password_reset_token = reset_token
        user.password_reset_expires_at = datetime.now(timezone.utc) + timedelta(hours=self.reset_token_expiry_hours)
        
        db.commit()
        
        logger.info(f"Created password reset token for user {email}")
        return reset_token
    
    def verify_reset_token(self, db: Session, token: str) -> Optional[User]:
        """Verify password reset token"""
        
        user = db.query(User).filter(User.password_reset_token == token).first()
        if not user:
            return None
        
        # Check if token has expired
        if not user.password_reset_expires_at or datetime.now(timezone.utc) > user.password_reset_expires_at:
            logger.warning(f"Password reset token expired for user {user.email}")
            return None
        
        return user
    
    def reset_password(self, db: Session, token: str, new_password: str) -> bool:
        """Reset user password using reset token"""
        
        user = self.verify_reset_token(db, token)
        if not user:
            return False
        
        # Truncate password to 72 bytes for bcrypt compatibility
        truncated_password = new_password[:72]
        
        # Update password
        user.password_hash = get_password_hash(truncated_password)
        user.password_reset_token = None
        user.password_reset_expires_at = None
        user.temp_password_expires_at = None  # Clear temp password expiry
        user.is_fresh = False  # Mark as no longer fresh
        
        db.commit()
        
        logger.info(f"Password reset successful for user {user.email}")
        return True
    
    def change_password(self, db: Session, user_id: int, current_password: str, new_password: str) -> bool:
        """Change user password (requires current password)"""
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        # Verify current password
        if not verify_password(current_password, user.password_hash):
            return False
        
        # Truncate password to 72 bytes for bcrypt compatibility
        truncated_password = new_password[:72]
        
        # Update password
        user.password_hash = get_password_hash(truncated_password)
        user.temp_password_expires_at = None  # Clear temp password expiry
        user.is_fresh = False  # Mark as no longer fresh
        
        db.commit()
        
        logger.info(f"Password changed successfully for user {user.email}")
        return True
    
    def cleanup_expired_tokens(self, db: Session) -> int:
        """Clean up expired password reset tokens"""
        
        expired_users = db.query(User).filter(
            User.password_reset_expires_at < datetime.now(timezone.utc)
        ).all()
        
        count = 0
        for user in expired_users:
            user.password_reset_token = None
            user.password_reset_expires_at = None
            count += 1
        
        if count > 0:
            db.commit()
            logger.info(f"Cleaned up {count} expired password reset tokens")
        
        return count


# Global password service instance
password_service = PasswordService()


