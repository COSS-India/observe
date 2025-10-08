from sqlalchemy.orm import Session, joinedload
from app.models.user import User, Organization, SupervisorDetail, MouInfo, ReferenceDocument, AssociatedManager
from app.schemas.user import UserProfileResponse, UsersListResponse, OrganizationResponse, SupervisorDetailResponse, MouInfoResponse, ReferenceDocumentResponse, AssociatedManagerResponse, OrgDetailsResponse, OrgAddress
from fastapi import HTTPException, status
from typing import List, Optional
from sqlalchemy import and_


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Get user by ID with all related data"""
    return db.query(User).options(
        joinedload(User.org),
        joinedload(User.supervisor_details),
        joinedload(User.mou_info),
        joinedload(User.reference_documents),
        joinedload(User.associated_managers)
    ).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email with all related data"""
    return db.query(User).options(
        joinedload(User.org),
        joinedload(User.supervisor_details),
        joinedload(User.mou_info),
        joinedload(User.reference_documents),
        joinedload(User.associated_managers)
    ).filter(User.email == email).first()


def get_all_users(db: Session, skip: int = 0, limit: int = 100, include_deleted: bool = False) -> List[User]:
    """Get all users with pagination and optional deleted users"""
    query = db.query(User).options(
        joinedload(User.org),
        joinedload(User.supervisor_details),
        joinedload(User.mou_info),
        joinedload(User.reference_documents),
        joinedload(User.associated_managers)
    )
    
    if not include_deleted:
        query = query.filter(User.is_deleted == False)
    
    return query.offset(skip).limit(limit).all()


def get_users_count(db: Session, include_deleted: bool = False) -> int:
    """Get total count of users"""
    query = db.query(User)
    if not include_deleted:
        query = query.filter(User.is_deleted == False)
    return query.count()


def convert_user_to_profile_response(user: User) -> UserProfileResponse:
    """Convert User model to UserProfileResponse schema"""
    
    # Convert organization
    org_response = None
    if user.org:
        org_details = OrgDetailsResponse(
            ministry_name=user.org.ministry_name,
            department_name=user.org.department_name
        )
        
        org_address = None
        if user.org.address:
            org_address = OrgAddress(
                address_type=user.org.address_type or "Primary",
                address=user.org.address,
                pincode=user.org.pincode or "",
                state=user.org.state or "",
                city=user.org.city or ""
            )
        
        org_response = OrganizationResponse(
            org_name=user.org.org_name,
            org_type=user.org.org_type,
            org_details=org_details,
            org_website=user.org.org_website,
            org_address=org_address
        )
    
    # Convert supervisor details
    supervisor_details = []
    for supervisor in user.supervisor_details:
        supervisor_details.append(SupervisorDetailResponse(
            first_name=supervisor.first_name,
            last_name=supervisor.last_name,
            official_email=supervisor.official_email,
            designation=supervisor.designation,
            phone=supervisor.phone,
            id_proof=supervisor.id_proof
        ))
    
    # Convert MOU info
    mou_info = None
    if user.mou_info:
        mou_info = MouInfoResponse(
            mou_format=user.mou_info.mou_format or "",
            mou_custom_file_upload=user.mou_info.mou_custom_file_upload,
            mou_custom_filename=user.mou_info.mou_custom_filename,
            mou_status=user.mou_info.mou_status,
            remarks=user.mou_info.remarks or "",
            mou_requested_by=user.mou_info.mou_requested_by or "",
            requested_on=user.mou_info.requested_on,
            updated_on=user.mou_info.updated_on,
            is_deleted=user.mou_info.is_deleted,
            deleted_on=user.mou_info.deleted_on
        )
    
    # Convert reference documents
    reference_documents = []
    for doc in user.reference_documents:
        reference_documents.append(ReferenceDocumentResponse(
            file_name=doc.file_name,
            blob_file_name=doc.blob_file_name,
            role=doc.role,
            uploaded_by=doc.uploaded_by,
            uploaded_on=doc.uploaded_on
        ))
    
    # Convert associated managers
    associated_managers = []
    for manager in user.associated_managers:
        associated_managers.append(AssociatedManagerResponse(
            application_name=manager.application_name,
            manager_email=manager.manager_email
        ))
    
    return UserProfileResponse(
        id=str(user.id),  # User ID as string
        _id=str(user.id),  # Convert to string to match original API
        first_name=user.first_name,
        last_name=user.last_name,
        designation=user.designation,
        gender=user.gender,
        email_id=user.email_id or user.email,  # Use email_id if available, fallback to email
        personal_email=user.personal_email,
        phone=user.phone,
        org=org_response,
        status=user.status,
        role=user.role,
        user_type=user.user_type or [],
        product_access=user.product_access or [],
        mou_info=mou_info,
        supervisor_details=supervisor_details,
        additional_contacts=user.additional_contacts,
        created_on=user.created_at,
        updated_on=user.updated_at or user.created_at,
        is_fresh=user.is_fresh,
        is_profile_updated=user.is_profile_updated,
        is_deleted=user.is_deleted,
        deleted_on=user.deleted_on,
        tnc_url=user.tnc_url,
        tnc_accepted=user.tnc_accepted,
        reference_documents=reference_documents,
        last_login=user.last_login,
        is_exisiting_user=user.is_exisiting_user,
        is_test_user=user.is_test_user,
        pending_req_count=user.pending_req_count,
        associated_manager=associated_managers,
        is_parichay=user.is_parichay
    )


def get_user_profile_by_id(db: Session, user_id: int) -> UserProfileResponse:
    """Get user profile by ID"""
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return convert_user_to_profile_response(user)


def get_user_profile_by_email(db: Session, email: str) -> UserProfileResponse:
    """Get user profile by email"""
    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return convert_user_to_profile_response(user)


def get_all_users_profiles(db: Session, skip: int = 0, limit: int = 100, include_deleted: bool = False) -> UsersListResponse:
    """Get all users profiles with pagination"""
    users = get_all_users(db, skip, limit, include_deleted)
    total = get_users_count(db, include_deleted)
    
    user_profiles = [convert_user_to_profile_response(user) for user in users]
    
    return UsersListResponse(
        users=user_profiles,
        total=total,
        page=(skip // limit) + 1,
        per_page=limit
    )
