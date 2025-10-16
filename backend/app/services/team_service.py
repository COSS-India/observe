from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, asc
from app.models.team import Team, TeamOrganizationMapping
from app.models.organization import OrganizationCRUD
from app.schemas.team import (
    TeamCreate, 
    TeamUpdate, 
    TeamResponse, 
    TeamListResponse,
    TeamOrganizationMappingCreate,
    TeamOrganizationMappingResponse,
    OrganizationTeamsResponse,
    TeamDelete
)
from fastapi import HTTPException, status
from typing import List, Optional
from datetime import datetime


def create_team(db: Session, team: TeamCreate) -> TeamResponse:
    """Create a new team"""
    
    # Check if team with same name already exists
    existing_team = db.query(Team).filter(
        Team.name == team.name,
        Team.is_deleted == False
    ).first()
    
    if existing_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team with this name already exists"
        )
    
    # Create new team
    db_team = Team(
        name=team.name,
        description=team.description,
        status=team.status or "active",
        created_by=team.created_by
    )
    
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    
    return TeamResponse.from_orm(db_team)


def get_team_by_id(db: Session, team_id: int, include_deleted: bool = False) -> Optional[TeamResponse]:
    """Get team by ID"""
    query = db.query(Team).filter(Team.id == team_id)
    
    if not include_deleted:
        query = query.filter(Team.is_deleted == False)
    
    team = query.first()
    
    if not team:
        return None
    
    return TeamResponse.from_orm(team)


def get_teams(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    include_deleted: bool = False,
    sort_by: str = "created_at",
    sort_order: str = "desc"
) -> TeamListResponse:
    """Get teams with pagination and sorting"""
    
    query = db.query(Team)
    
    if not include_deleted:
        query = query.filter(Team.is_deleted == False)
    
    # Apply sorting
    if hasattr(Team, sort_by):
        if sort_order.lower() == "desc":
            query = query.order_by(desc(getattr(Team, sort_by)))
        else:
            query = query.order_by(asc(getattr(Team, sort_by)))
    else:
        # Default sorting
        query = query.order_by(desc(Team.created_at))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    teams = query.offset(skip).limit(limit).all()
    
    # Convert to response format
    team_responses = [TeamResponse.from_orm(team) for team in teams]
    
    return TeamListResponse(
        teams=team_responses,
        total=total,
        page=(skip // limit) + 1,
        per_page=limit
    )


def update_team(db: Session, team_id: int, team_update: TeamUpdate) -> TeamResponse:
    """Update a team"""
    
    # Get existing team
    db_team = db.query(Team).filter(
        Team.id == team_id,
        Team.is_deleted == False
    ).first()
    
    if not db_team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check if name is being changed and if new name already exists
    if team_update.name and team_update.name != db_team.name:
        existing_team = db.query(Team).filter(
            Team.name == team_update.name,
            Team.id != team_id,
            Team.is_deleted == False
        ).first()
        
        if existing_team:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team with this name already exists"
            )
    
    # Update fields
    update_data = team_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_team, field, value)
    
    # Update timestamp
    db_team.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_team)
    
    return TeamResponse.from_orm(db_team)


def soft_delete_team(db: Session, team_id: int, deleted_by: Optional[str] = None) -> bool:
    """Soft delete a team and remove its organization mapping"""
    
    db_team = db.query(Team).filter(
        Team.id == team_id,
        Team.is_deleted == False
    ).first()
    
    if not db_team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Remove organization mapping if exists
    mapping = db.query(TeamOrganizationMapping).filter(
        TeamOrganizationMapping.team_id == team_id,
        TeamOrganizationMapping.is_active == True
    ).first()
    
    if mapping:
        mapping.is_active = False
    
    # Soft delete team
    db_team.is_deleted = True
    db_team.deleted_at = datetime.utcnow()
    db_team.deleted_by = deleted_by
    
    db.commit()
    
    return True


# Team-Organization Mapping Functions

def map_team_to_organization(db: Session, mapping: TeamOrganizationMappingCreate) -> TeamOrganizationMappingResponse:
    """Map a team to an organization"""
    
    # Check if team exists and is not deleted
    team = db.query(Team).filter(
        Team.id == mapping.team_id,
        Team.is_deleted == False
    ).first()
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check if organization exists
    organization = db.query(OrganizationCRUD).filter(
        OrganizationCRUD.id == mapping.organization_id,
        OrganizationCRUD.is_deleted == False
    ).first()
    
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Check if team is already mapped to any organization
    existing_mapping = db.query(TeamOrganizationMapping).filter(
        TeamOrganizationMapping.team_id == mapping.team_id,
        TeamOrganizationMapping.is_active == True
    ).first()
    
    if existing_mapping:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team is already mapped to an organization"
        )
    
    # Create new mapping
    db_mapping = TeamOrganizationMapping(
        team_id=mapping.team_id,
        organization_id=mapping.organization_id,
        created_by=mapping.created_by
    )
    
    db.add(db_mapping)
    db.commit()
    db.refresh(db_mapping)
    
    return TeamOrganizationMappingResponse.from_orm(db_mapping)


def unmap_team_from_organization(db: Session, team_id: int) -> bool:
    """Unmap a team from its organization"""
    
    # Check if team exists
    team = db.query(Team).filter(
        Team.id == team_id,
        Team.is_deleted == False
    ).first()
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Find active mapping
    mapping = db.query(TeamOrganizationMapping).filter(
        TeamOrganizationMapping.team_id == team_id,
        TeamOrganizationMapping.is_active == True
    ).first()
    
    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team is not mapped to any organization"
        )
    
    # Deactivate mapping
    mapping.is_active = False
    
    db.commit()
    
    return True


def get_teams_by_organization(db: Session, organization_id: int) -> OrganizationTeamsResponse:
    """Get all teams mapped to an organization"""
    
    # Check if organization exists
    organization = db.query(OrganizationCRUD).filter(
        OrganizationCRUD.id == organization_id,
        OrganizationCRUD.is_deleted == False
    ).first()
    
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Get all active mappings for this organization
    mappings = db.query(TeamOrganizationMapping).filter(
        TeamOrganizationMapping.organization_id == organization_id,
        TeamOrganizationMapping.is_active == True
    ).all()
    
    # Get team IDs
    team_ids = [mapping.team_id for mapping in mappings]
    
    # Get teams
    teams = []
    if team_ids:
        teams_query = db.query(Team).filter(
            Team.id.in_(team_ids),
            Team.is_deleted == False
        ).all()
        teams = [TeamResponse.from_orm(team) for team in teams_query]
    
    return OrganizationTeamsResponse(
        organization_id=organization_id,
        organization_name=organization.name,
        teams=teams,
        total_teams=len(teams)
    )


def get_team_organization_mapping(db: Session, team_id: int) -> Optional[TeamOrganizationMappingResponse]:
    """Get organization mapping for a team"""
    
    mapping = db.query(TeamOrganizationMapping).filter(
        TeamOrganizationMapping.team_id == team_id,
        TeamOrganizationMapping.is_active == True
    ).first()
    
    if not mapping:
        return None
    
    return TeamOrganizationMappingResponse.from_orm(mapping)
