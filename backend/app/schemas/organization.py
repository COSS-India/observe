from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime


# Validation helper function
def validate_not_placeholder(value: str, field_name: str) -> str:
    """Validate that a string field is not a placeholder value like 'string'"""
    if not value or value.strip() == "":
        raise ValueError(f"{field_name} cannot be empty")
    
    # Check for common placeholder values
    placeholder_values = ["string", "String", "STRING", "text", "Text", "TEXT", "value", "Value", "VALUE"]
    if value.strip() in placeholder_values:
        raise ValueError(f"{field_name} must be a meaningful value, not a placeholder like '{value}'")
    
    # Check minimum length
    if len(value.strip()) < 2:
        raise ValueError(f"{field_name} must be at least 2 characters long")
    
    return value.strip()


# Base organization schema
class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Organization name")
    description: Optional[str] = Field(None, description="Organization description")
    org_type: Optional[str] = Field(None, max_length=100, description="Organization type")
    website: Optional[str] = Field(None, max_length=500, description="Organization website")
    email: Optional[str] = Field(None, max_length=255, description="Organization email")
    phone: Optional[str] = Field(None, max_length=20, description="Organization phone")
    
    # Address fields
    address: Optional[str] = Field(None, description="Organization address")
    city: Optional[str] = Field(None, max_length=100, description="City")
    state: Optional[str] = Field(None, max_length=100, description="State")
    country: Optional[str] = Field(None, max_length=100, description="Country")
    pincode: Optional[str] = Field(None, max_length=10, description="Pincode")
    
    # Status
    status: Optional[str] = Field("active", max_length=50, description="Organization status")
    
    # Metadata
    org_metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")
    
    @validator('name')
    def validate_name(cls, v):
        return validate_not_placeholder(v, "Organization name")
    
    @validator('org_type')
    def validate_org_type(cls, v):
        if v is not None:
            return validate_not_placeholder(v, "Organization type")
        return v
    
    @validator('status')
    def validate_status(cls, v):
        if v not in ["active", "inactive", "suspended"]:
            raise ValueError("Status must be one of: active, inactive, suspended")
        return v


# Schema for creating organization
class OrganizationCreate(OrganizationBase):
    created_by: Optional[str] = Field(None, description="User who created the organization")


# Schema for updating organization
class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    org_type: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=500)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    
    # Address fields
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    pincode: Optional[str] = Field(None, max_length=10)
    
    # Status
    status: Optional[str] = Field(None, max_length=50)
    
    # Metadata
    org_metadata: Optional[Dict[str, Any]] = None
    
    # Audit field
    updated_by: Optional[str] = Field(None, description="User who updated the organization")
    
    @validator('name')
    def validate_name(cls, v):
        if v is not None:
            return validate_not_placeholder(v, "Organization name")
        return v
    
    @validator('org_type')
    def validate_org_type(cls, v):
        if v is not None:
            return validate_not_placeholder(v, "Organization type")
        return v
    
    @validator('status')
    def validate_status(cls, v):
        if v is not None and v not in ["active", "inactive", "suspended"]:
            raise ValueError("Status must be one of: active, inactive, suspended")
        return v


# Schema for organization response
class OrganizationResponse(OrganizationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    is_deleted: bool
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None

    class Config:
        from_attributes = True


# Schema for organization list response
class OrganizationListResponse(BaseModel):
    organizations: list[OrganizationResponse]
    total: int
    page: int
    per_page: int


# Schema for soft delete
class OrganizationDelete(BaseModel):
    deleted_by: Optional[str] = Field(None, description="User who deleted the organization")


# Schema for organization search/filter
class OrganizationFilter(BaseModel):
    name: Optional[str] = None
    org_type: Optional[str] = None
    status: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    is_deleted: Optional[bool] = False
    created_by: Optional[str] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
