from sqlalchemy.orm import Session
from app.models.user import User, Organization
from app.schemas.user import SigninRequest, SignupRequest, SigninResponse, UserInfo
from app.utils.security import verify_password, get_password_hash, create_access_token, generate_simple_password
import secrets
import string
from app.services.captcha_service import verify_captcha
from fastapi import HTTPException, status
from datetime import datetime


def authenticate_user(db: Session, signin_request: SigninRequest) -> SigninResponse:
    """Authenticate user with captcha verification"""
    
    # First verify captcha
    if not verify_captcha(db, signin_request.captcha_id, signin_request.captcha_text):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid captcha"
        )
    
    # Find user by email
    user = db.query(User).filter(User.email == signin_request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password (simple verification, no length validation needed)
    if not verify_password(signin_request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create access token
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    }
    access_token = create_access_token(data=token_data)
    
    # Create user info
    user_info = UserInfo(
        is_fresh=user.is_fresh,
        is_profile_updated=user.is_profile_updated,
        is_existing_user=user.is_existing_user,
        stage_completed=user.stage_completed
    )
    
    # Simple success message
    message = "Login successful"
    
    # Create response
    response = SigninResponse(
        email=user.email,
        token=access_token,
        role=user.role,
        username=user.username or f"{user.first_name} {user.last_name}",
        org_type=user.org_type or "",
        userinfo=user_info,
        message=message,
        user_type=user.user_type or [],
        event_name=None,
        is_external=user.is_external
    )
    
    return response


def create_user(db: Session, signup_request: SignupRequest) -> dict:
    """Create a new user with complete profile"""
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == signup_request.email_id).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Use provided password or generate default
    print(f"[DEBUG] Starting password generation for user: {signup_request.email_id}")
    if signup_request.password:
        initial_password = signup_request.password
        print(f"[DEBUG] Using provided custom password: '{initial_password}'")
    else:
        initial_password = generate_simple_password(signup_request.email_id)
        print(f"[DEBUG] Generated password: '{initial_password}'")
    print(f"[DEBUG] About to hash password: '{initial_password}'")
    password_hash = get_password_hash(initial_password)
    print(f"[DEBUG] Password hashed successfully")
    
    user = User(
        first_name=signup_request.first_name,
        last_name=signup_request.last_name,
        email=signup_request.email_id,
        email_id=signup_request.email_id,  # Set email_id field
        password_hash=password_hash,
        role=signup_request.role,
        org_type=signup_request.org.org_type,
        org_name=signup_request.org.org_name,
        org_details=signup_request.org.org_details.dict(),
        tnc_url=signup_request.tnc_url,
        is_fresh=True,
        is_profile_updated=False,
        is_existing_user=False,
        is_external=False,
        status="Engaged",
        user_type=[signup_request.org.org_type.lower()],  # Set user_type based on org_type
        product_access=[],  # Empty initially
        tnc_accepted=False,  # Will be true after they accept
        pending_req_count=0,
        is_test_user=False,
        is_parichay=False
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create organization record for complete profile
    organization = Organization(
        user_id=user.id,
        org_name=signup_request.org.org_name,
        org_type=signup_request.org.org_type,
        org_website=None,  # Can be added later
        ministry_name=getattr(signup_request.org.org_details, 'ministry_name', None),
        department_name=getattr(signup_request.org.org_details, 'department_name', None),
        address_type="Primary",
        address=None,  # Can be added later
        pincode=None,
        state=None,
        city=None
    )
    
    db.add(organization)
    db.commit()
    
    return {
        "message": f"User created successfully. Your initial password is: {initial_password}. Please login and change it immediately.",
        "initial_password": initial_password
    }


def get_user_by_email(db: Session, email: str) -> User:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> User:
    """Get user by ID"""
    return db.query(User).filter(User.id == user_id).first()
