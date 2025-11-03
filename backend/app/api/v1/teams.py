from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.core.database import get_db
from app.models.user import Team, TeamOrganization, Organization
from app.schemas.team import (
    TeamCreate,
    TeamUpdate,
    TeamResponse,
    TeamWithOrganization,
    TeamsListResponse,
    TeamListItem
)

router = APIRouter()


# Organization response schema
class OrganizationListItem(BaseModel):
    id: int
    org_name: str
    org_type: str

    class Config:
        from_attributes = True


@router.post("/teams", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(team_data: TeamCreate, db: Session = Depends(get_db)):
    """
    Create a new team and map it to an organization
    """
    # Check if grafana_team_id already exists
    existing_team = db.query(Team).filter(Team.grafana_team_id == team_data.grafana_team_id).first()
    if existing_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Team with Grafana ID {team_data.grafana_team_id} already exists"
        )

    # Check if organization exists
    organization = db.query(Organization).filter(Organization.id == team_data.organization_id).first()
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization with ID {team_data.organization_id} not found"
        )

    # Create team
    new_team = Team(
        grafana_team_id=team_data.grafana_team_id,
        team_name=team_data.team_name,
        email=team_data.email
    )
    db.add(new_team)
    db.commit()
    db.refresh(new_team)

    # Create team-organization mapping
    team_org_mapping = TeamOrganization(
        team_id=new_team.id,
        organization_id=team_data.organization_id
    )
    db.add(team_org_mapping)
    db.commit()

    return new_team


@router.get("/teams", response_model=List[TeamWithOrganization])
async def list_teams(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    List all teams with their organization details
    """
    teams = db.query(Team).offset(skip).limit(limit).all()

    result = []
    for team in teams:
        # Get organization mapping
        team_org = db.query(TeamOrganization).filter(TeamOrganization.team_id == team.id).first()
        org_id = None
        org_name = None

        if team_org:
            org = db.query(Organization).filter(Organization.id == team_org.organization_id).first()
            if org:
                org_id = org.id
                org_name = org.org_name

        result.append({
            "id": team.id,
            "team_name": team.team_name,
            "email": team.email,
            "grafana_team_id": team.grafana_team_id,
            "created_at": team.created_at,
            "updated_at": team.updated_at,
            "organization_id": org_id,
            "organization_name": org_name
        })

    return result


@router.get("/teams/{team_id}", response_model=TeamWithOrganization)
async def get_team(team_id: int, db: Session = Depends(get_db)):
    """
    Get a specific team by ID
    """
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with ID {team_id} not found"
        )

    # Get organization mapping
    team_org = db.query(TeamOrganization).filter(TeamOrganization.team_id == team.id).first()
    org_id = None
    org_name = None

    if team_org:
        org = db.query(Organization).filter(Organization.id == team_org.organization_id).first()
        if org:
            org_id = org.id
            org_name = org.org_name

    return {
        "id": team.id,
        "team_name": team.team_name,
        "email": team.email,
        "grafana_team_id": team.grafana_team_id,
        "created_at": team.created_at,
        "updated_at": team.updated_at,
        "organization_id": org_id,
        "organization_name": org_name
    }


@router.put("/teams/{team_id}", response_model=TeamResponse)
async def update_team(team_id: int, team_data: TeamUpdate, db: Session = Depends(get_db)):
    """
    Update a team's details
    """
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with ID {team_id} not found"
        )

    # Update fields if provided
    if team_data.team_name is not None:
        team.team_name = team_data.team_name
    if team_data.email is not None:
        team.email = team_data.email

    db.commit()
    db.refresh(team)

    return team


@router.delete("/teams/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(team_id: int, db: Session = Depends(get_db)):
    """
    Delete a team and its organization mappings
    """
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with ID {team_id} not found"
        )

    # Delete team (cascade will handle team_organizations)
    db.delete(team)
    db.commit()

    return None


@router.get("/organizations/{org_name}/teams", response_model=List[TeamListItem])
async def get_teams_by_organization_name(org_name: str, db: Session = Depends(get_db)):
    """
    Get all teams for an organization by organization name.
    This is used during login to fetch user's teams based on their organization.
    """
    # Find organization by name (case-insensitive)
    organization = db.query(Organization).filter(
        Organization.org_name.ilike(org_name)
    ).first()

    if not organization:
        # Return empty list if organization not found
        return []

    # Get all team-organization mappings for this org
    team_org_mappings = db.query(TeamOrganization).filter(
        TeamOrganization.organization_id == organization.id
    ).all()

    teams = []
    for mapping in team_org_mappings:
        team = db.query(Team).filter(Team.id == mapping.team_id).first()
        if team:
            teams.append({
                "id": team.id,
                "name": team.team_name,
                "email": team.email,
                "grafanaTeamId": team.grafana_team_id
            })

    return teams


@router.get("/organizations/{org_id}/teams-by-id", response_model=List[TeamListItem])
async def get_teams_by_organization_id(org_id: int, db: Session = Depends(get_db)):
    """
    Get all teams for an organization by organization ID
    """
    # Check if organization exists
    organization = db.query(Organization).filter(Organization.id == org_id).first()
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization with ID {org_id} not found"
        )

    # Get all team-organization mappings for this org
    team_org_mappings = db.query(TeamOrganization).filter(
        TeamOrganization.organization_id == org_id
    ).all()

    teams = []
    for mapping in team_org_mappings:
        team = db.query(Team).filter(Team.id == mapping.team_id).first()
        if team:
            teams.append({
                "id": team.id,
                "name": team.team_name,
                "email": team.email,
                "grafanaTeamId": team.grafana_team_id
            })

    return teams


@router.get("/organizations", response_model=List[OrganizationListItem])
async def list_organizations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    List all unique organizations for dropdown selection during team creation.
    Returns distinct organizations by org_name to avoid duplicates.
    Uses DISTINCT ON for efficient querying.
    """
    from sqlalchemy import func, distinct

    # Query distinct organizations by org_name, org_type
    # Get the first organization for each unique org_name
    subquery = (
        db.query(
            Organization.org_name,
            func.min(Organization.id).label('min_id')
        )
        .group_by(Organization.org_name, Organization.org_type)
        .subquery()
    )

    # Get the full organization records
    organizations = (
        db.query(Organization)
        .join(subquery, Organization.id == subquery.c.min_id)
        .order_by(Organization.org_name)
        .offset(skip)
        .limit(limit)
        .all()
    )

    return organizations
