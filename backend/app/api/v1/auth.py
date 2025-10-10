from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user import (
    SigninRequest, SigninResponse, SignupRequest, SignupResponse, CaptchaResponse, 
    UserProfileResponse, UsersListResponse
)
from app.services.auth_service import authenticate_user, create_user
from app.services.user_service import get_user_profile_by_id, get_all_users_profiles
from app.services.captcha_service import create_captcha
from typing import Dict, Any, Optional

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
    signup_request: SignupRequest,
    db: Session = Depends(get_db)
):
    """Customer signup with JSON data"""
    print(f"[DEBUG] Signup endpoint called for: {signup_request.email_id}")
    
    try:
        # Create user
        print("[DEBUG] Calling create_user function...")
        response = create_user(db, signup_request)
        print(f"[DEBUG] User created successfully: {response}")
        
        return SignupResponse(**response)
        
    except Exception as e:
        print(f"[DEBUG] Unexpected error in signup: {e}")
        print(f"[DEBUG] Error type: {type(e)}")
        import traceback
        print(f"[DEBUG] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Signup failed: {str(e)}"
        )


# User Profile APIs
@router.get("/users", response_model=UsersListResponse)
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

