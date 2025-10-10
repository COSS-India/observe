from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime


# Signin schemas
class SigninRequest(BaseModel):
    email: EmailStr
    password: str
    captcha_text: str
    captcha_id: str


class UserInfo(BaseModel):
    is_fresh: bool
    is_profile_updated: bool
    is_existing_user: bool
    stage_completed: Optional[str] = None


class SigninResponse(BaseModel):
    email: str
    token: str
    role: str
    username: str
    org_type: str
    userinfo: UserInfo
    message: str
    user_type: List[str]
    event_name: Optional[str] = None
    is_external: bool


# Signup schemas
class OrgDetails(BaseModel):
    industry_type: str
    is_startup: bool
    is_dpiit_certified: bool
    is_interested_in_api_integration: bool


class Org(BaseModel):
    org_type: str
    org_name: str
    org_details: OrgDetails


class SignupRequest(BaseModel):
    first_name: str
    last_name: str
    email_id: EmailStr
    role: str = "customer"
    org: Org
    tnc_url: str
    password: Optional[str] = None


class SignupResponse(BaseModel):
    message: str
    initial_password: Optional[str] = None


# Captcha schemas
class CaptchaData(BaseModel):
    captcha_id: str
    image: str


class CaptchaResponse(BaseModel):
    captcha: CaptchaData


# User model schemas
class UserBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    role: str = "customer"
    username: Optional[str] = None
    org_type: Optional[str] = None
    org_name: Optional[str] = None
    org_details: Optional[Dict[str, Any]] = None
    is_fresh: bool = True
    is_profile_updated: bool = False
    is_existing_user: bool = False
    stage_completed: Optional[str] = None
    user_type: Optional[List[str]] = None
    is_external: bool = False
    tnc_url: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserInDB(UserBase):
    id: int
    password_hash: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# New schemas for comprehensive user profile API
class OrgAddress(BaseModel):
    address_type: str
    address: str
    pincode: str
    state: str
    city: str


class OrgDetailsResponse(BaseModel):
    ministry_name: Optional[str] = None
    department_name: Optional[str] = None


class OrganizationResponse(BaseModel):
    org_name: str
    org_type: str
    org_details: OrgDetailsResponse
    org_website: Optional[str] = None
    org_address: Optional[OrgAddress] = None


class SupervisorDetailResponse(BaseModel):
    first_name: str
    last_name: str
    official_email: str
    designation: Optional[str] = None
    phone: Optional[str] = None
    id_proof: Optional[str] = None


class MouInfoResponse(BaseModel):
    mou_format: str
    mou_custom_file_upload: Optional[str] = None
    mou_custom_filename: Optional[str] = None
    mou_status: str
    remarks: str
    mou_requested_by: str
    requested_on: Optional[datetime] = None
    updated_on: Optional[datetime] = None
    is_deleted: bool
    deleted_on: Optional[datetime] = None


class ReferenceDocumentResponse(BaseModel):
    file_name: str
    blob_file_name: str
    role: str
    uploaded_by: str
    uploaded_on: datetime


class AssociatedManagerResponse(BaseModel):
    application_name: str
    manager_email: str


class UserProfileResponse(BaseModel):
    id: str  # User ID as string
    _id: str  # Using string ID to match original API (alias)
    first_name: str
    last_name: str
    designation: Optional[str] = None
    gender: Optional[str] = None
    email_id: str
    personal_email: Optional[str] = None
    phone: Optional[str] = None
    org: Optional[OrganizationResponse] = None
    status: str
    role: str
    user_type: List[str]
    product_access: List[str]
    mou_info: Optional[MouInfoResponse] = None
    supervisor_details: List[SupervisorDetailResponse]
    additional_contacts: Optional[Any] = None
    created_on: datetime
    updated_on: datetime
    is_fresh: bool
    is_profile_updated: bool
    is_deleted: bool
    deleted_on: Optional[datetime] = None
    tnc_url: Optional[str] = None
    tnc_accepted: bool
    reference_documents: List[ReferenceDocumentResponse]
    last_login: Optional[datetime] = None
    is_exisiting_user: bool  # Typo in original API
    is_test_user: bool
    pending_req_count: int
    associated_manager: List[AssociatedManagerResponse]
    is_parichay: bool

    class Config:
        from_attributes = True


class UsersListResponse(BaseModel):
    users: List[UserProfileResponse]
    total: int
    page: int
    per_page: int
