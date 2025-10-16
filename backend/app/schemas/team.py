from pydantic import BaseModel, Field, validator
from typing import Optional
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


# Base team schema
class TeamBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Team name")
    description: Optional[str] = Field(None, description="Team description")
    status: Optional[str] = Field("active", max_length=50, description="Team status")
    
    @validator('name')
    def validate_name(cls, v):
        return validate_not_placeholder(v, "Team name")
    
    @validator('status')
    def validate_status(cls, v):
        if v not in ["active", "inactive"]:
            raise ValueError("Status must be one of: active, inactive")
        return v


# Schema for creating team
class TeamCreate(TeamBase):
    created_by: Optional[str] = Field(None, description="User who created the team")


# Schema for updating team
class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(None, max_length=50)
    updated_by: Optional[str] = Field(None, description="User who updated the team")
    
    @validator('name')
    def validate_name(cls, v):
        if v is not None:
            return validate_not_placeholder(v, "Team name")
        return v
    
    @validator('status')
    def validate_status(cls, v):
        if v is not None and v not in ["active", "inactive"]:
            raise ValueError("Status must be one of: active, inactive")
        return v


# Schema for team response
class TeamResponse(TeamBase):
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


# Schema for team list response
class TeamListResponse(BaseModel):
    teams: list[TeamResponse]
    total: int
    page: int
    per_page: int


# Schema for team-organization mapping
class TeamOrganizationMappingCreate(BaseModel):
    team_id: int = Field(..., description="Team ID to map")
    organization_id: int = Field(..., description="Organization ID to map to")
    created_by: Optional[str] = Field(None, description="User who created the mapping")


class TeamOrganizationMappingResponse(BaseModel):
    id: int
    team_id: int
    organization_id: int
    created_at: datetime
    created_by: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


# Schema for organization teams response
class OrganizationTeamsResponse(BaseModel):
    organization_id: int
    organization_name: str
    teams: list[TeamResponse]
    total_teams: int


# Schema for team delete
class TeamDelete(BaseModel):
    deleted_by: Optional[str] = Field(None, description="User who deleted the team")
