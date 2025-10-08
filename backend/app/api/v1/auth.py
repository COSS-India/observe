from fastapi import APIRouter, Depends, HTTPException, status, Form, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user import (
    SigninRequest, SigninResponse, SignupRequest, SignupResponse, CaptchaResponse, 
    UserProfileResponse, UsersListResponse, PasswordResetRequest, PasswordResetResponse,
    PasswordResetConfirmRequest, PasswordChangeRequest, PasswordChangeResponse
)
from app.services.auth_service import authenticate_user, create_user
from app.services.user_service import get_user_profile_by_id, get_user_profile_by_email, get_all_users_profiles
from app.services.captcha_service import create_captcha
from app.services.password_service import password_service
from app.services.email_service import email_service
from app.models.user import User
from typing import Dict, Any, Optional
import json

router = APIRouter()


@router.post("/captcha", response_model=CaptchaResponse)
async def get_captcha(db: Session = Depends(get_db)):
    """Generate a new captcha"""
    try:
        captcha_data = create_captcha(db)
        return CaptchaResponse(captcha=captcha_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate captcha: {str(e)}"
        )


@router.post("/signin", response_model=SigninResponse)
async def signin(signin_request: SigninRequest, db: Session = Depends(get_db)):
    """User signin with captcha verification"""
    try:
        response = authenticate_user(db, signin_request)
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Signin failed: {str(e)}"
        )


@router.post("/signup", response_model=SignupResponse)
async def signup(
    request_data: str = Form(...),
    db: Session = Depends(get_db)
):
    """Customer signup with form data"""
    try:
        # Parse the JSON string from form data
        signup_data = json.loads(request_data)
        
        # Create SignupRequest object
        signup_request = SignupRequest(**signup_data)
        
        # Create user
        response = create_user(db, signup_request)
        return SignupResponse(**response)
        
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON in request_data"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Signup failed: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Adopter Login API is running"}


# User Profile APIs
@router.get("/users", response_model=UsersListResponse)
@router.get("/users/", response_model=UsersListResponse)
async def get_all_users(
    skip: int = Query(0, ge=0, description="Number of users to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of users to return"),
    include_deleted: bool = Query(False, description="Include deleted users"),
    db: Session = Depends(get_db)
):
    """Get all users with pagination"""
    try:
        return get_all_users_profiles(db, skip, limit, include_deleted)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch users: {str(e)}"
        )


@router.get("/users/{user_id}", response_model=UserProfileResponse)
@router.get("/users/{user_id}/", response_model=UserProfileResponse)
async def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    """Get user profile by ID"""
    try:
        return get_user_profile_by_id(db, user_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user: {str(e)}"
        )


# Password reset endpoints
@router.post("/password-reset", response_model=PasswordResetResponse)
async def request_password_reset(
    request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """Request password reset"""
    try:
        # Create password reset token
        reset_token = password_service.create_password_reset_token(db, request.email)
        
        if not reset_token:
            # User not found, but don't reveal this for security
            return PasswordResetResponse(
                message="If the email exists, a password reset link has been sent."
            )
        
        # Get user for email
        user = db.query(User).filter(User.email == request.email).first()
        if user:
            # Send password reset email
            email_sent = email_service.send_password_reset_email(
                to_email=user.email,
                first_name=user.first_name,
                reset_token=reset_token
            )
            
            if not email_sent:
                print(f"Warning: Failed to send password reset email to {user.email}")
        
        return PasswordResetResponse(
            message="If the email exists, a password reset link has been sent."
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process password reset request: {str(e)}"
        )


@router.post("/password-reset/confirm", response_model=PasswordResetResponse)
async def confirm_password_reset(
    request: PasswordResetConfirmRequest,
    db: Session = Depends(get_db)
):
    """Confirm password reset with token"""
    try:
        success = password_service.reset_password(db, request.token, request.new_password)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        return PasswordResetResponse(
            message="Password has been reset successfully. You can now login with your new password."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset password: {str(e)}"
        )


@router.get("/users/email/{email}", response_model=UserProfileResponse)
@router.get("/users/email/{email}/", response_model=UserProfileResponse)
async def get_user_by_email(email: str, db: Session = Depends(get_db)):
    """Get user profile by email"""
    try:
        return get_user_profile_by_email(db, email)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user: {str(e)}"
        )


# Password reset endpoints
@router.post("/password-reset", response_model=PasswordResetResponse)
async def request_password_reset(
    request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """Request password reset"""
    try:
        # Create password reset token
        reset_token = password_service.create_password_reset_token(db, request.email)
        
        if not reset_token:
            # User not found, but don't reveal this for security
            return PasswordResetResponse(
                message="If the email exists, a password reset link has been sent."
            )
        
        # Get user for email
        user = db.query(User).filter(User.email == request.email).first()
        if user:
            # Send password reset email
            email_sent = email_service.send_password_reset_email(
                to_email=user.email,
                first_name=user.first_name,
                reset_token=reset_token
            )
            
            if not email_sent:
                print(f"Warning: Failed to send password reset email to {user.email}")
        
        return PasswordResetResponse(
            message="If the email exists, a password reset link has been sent."
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process password reset request: {str(e)}"
        )


@router.post("/password-reset/confirm", response_model=PasswordResetResponse)
async def confirm_password_reset(
    request: PasswordResetConfirmRequest,
    db: Session = Depends(get_db)
):
    """Confirm password reset with token"""
    try:
        success = password_service.reset_password(db, request.token, request.new_password)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        return PasswordResetResponse(
            message="Password has been reset successfully. You can now login with your new password."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset password: {str(e)}"
        )
