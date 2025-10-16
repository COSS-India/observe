from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
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
from app.services.team_service import (
    create_team,
    get_team_by_id,
    get_teams,
    update_team,
    soft_delete_team,
    map_team_to_organization,
    unmap_team_from_organization,
    get_teams_by_organization,
    get_team_organization_mapping
)
from typing import Optional

router = APIRouter()


# Team CRUD endpoints
@router.post("/", response_model=TeamResponse)
async def create_team_endpoint(
    team: TeamCreate,
    db: Session = Depends(get_db)
):
    """Create a new team"""
    try:
        return create_team(db, team)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create team: {str(e)}"
        )


@router.get("/", response_model=TeamListResponse)
async def get_all_teams(
    skip: int = Query(0, ge=0, description="Number of teams to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of teams to return"),
    include_deleted: bool = Query(False, description="Include deleted teams"),
    sort_by: str = Query("created_at", description="Sort by field"),
    sort_order: str = Query("desc", description="Sort order (asc/desc)"),
    db: Session = Depends(get_db)
):
    """Get all teams with pagination and sorting"""
    try:
        return get_teams(db, skip, limit, include_deleted, sort_by, sort_order)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch teams: {str(e)}"
        )


@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: int,
    include_deleted: bool = Query(False, description="Include deleted teams"),
    db: Session = Depends(get_db)
):
    """Get team by ID"""
    try:
        team = get_team_by_id(db, team_id, include_deleted)
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found"
            )
        return team
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch team: {str(e)}"
        )


@router.put("/{team_id}", response_model=TeamResponse)
async def update_team_endpoint(
    team_id: int,
    team_update: TeamUpdate,
    db: Session = Depends(get_db)
):
    """Update a team"""
    try:
        return update_team(db, team_id, team_update)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update team: {str(e)}"
        )


@router.delete("/{team_id}")
async def delete_team(
    team_id: int,
    delete_request: TeamDelete,
    db: Session = Depends(get_db)
):
    """Soft delete a team"""
    try:
        success = soft_delete_team(db, team_id, delete_request.deleted_by)
        if success:
            return {"message": "Team deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete team"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete team: {str(e)}"
        )


# Team-Organization Mapping endpoints
@router.post("/map", response_model=TeamOrganizationMappingResponse)
async def map_team_to_org(
    mapping: TeamOrganizationMappingCreate,
    db: Session = Depends(get_db)
):
    """Map a team to an organization"""
    try:
        return map_team_to_organization(db, mapping)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to map team to organization: {str(e)}"
        )


@router.delete("/{team_id}/unmap")
async def unmap_team_from_org(
    team_id: int,
    db: Session = Depends(get_db)
):
    """Unmap a team from its organization"""
    try:
        success = unmap_team_from_organization(db, team_id)
        if success:
            return {"message": "Team unmapped from organization successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to unmap team"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unmap team: {str(e)}"
        )


@router.get("/organization/{organization_id}/teams", response_model=OrganizationTeamsResponse)
async def get_org_teams(
    organization_id: int,
    db: Session = Depends(get_db)
):
    """Get all teams mapped to an organization"""
    try:
        return get_teams_by_organization(db, organization_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch organization teams: {str(e)}"
        )


@router.get("/{team_id}/mapping", response_model=TeamOrganizationMappingResponse)
async def get_team_mapping(
    team_id: int,
    db: Session = Depends(get_db)
):
    """Get organization mapping for a team"""
    try:
        mapping = get_team_organization_mapping(db, team_id)
        if not mapping:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team is not mapped to any organization"
            )
        return mapping
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch team mapping: {str(e)}"
        )
