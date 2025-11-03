from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# Team Schemas
class TeamBase(BaseModel):
    team_name: str = Field(..., min_length=1, max_length=255)
    email: Optional[str] = None


class TeamCreate(TeamBase):
    grafana_team_id: int = Field(..., gt=0)
    organization_id: int = Field(..., gt=0)


class TeamUpdate(BaseModel):
    team_name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = None


class TeamResponse(TeamBase):
    id: int
    grafana_team_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TeamWithOrganization(TeamResponse):
    organization_id: Optional[int] = None
    organization_name: Optional[str] = None


# Team-Organization Mapping Schemas
class TeamOrganizationCreate(BaseModel):
    team_id: int = Field(..., gt=0)
    organization_id: int = Field(..., gt=0)


class TeamOrganizationResponse(BaseModel):
    id: int
    team_id: int
    organization_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Response schemas for frontend
class TeamListItem(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    grafanaTeamId: int


class TeamsListResponse(BaseModel):
    teams: List[TeamListItem]
    total: int
