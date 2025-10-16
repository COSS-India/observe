from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.organization import (
    OrganizationCreate, 
    OrganizationUpdate, 
    OrganizationResponse, 
    OrganizationListResponse,
    OrganizationDelete
)
from app.services.organization_service import (
    create_organization,
    get_organization_by_id,
    get_organizations,
    update_organization,
    soft_delete_organization,
    restore_organization,
    search_organizations
)
from typing import Optional

router = APIRouter()


@router.post("/", response_model=OrganizationResponse)
async def create_org(
    organization: OrganizationCreate,
    db: Session = Depends(get_db)
):
    """Create a new organization"""
    try:
        return create_organization(db, organization)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create organization: {str(e)}"
        )


@router.get("/", response_model=OrganizationListResponse)
async def get_all_organizations(
    skip: int = Query(0, ge=0, description="Number of organizations to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of organizations to return"),
    name: Optional[str] = Query(None, description="Filter by organization name"),
    org_type: Optional[str] = Query(None, description="Filter by organization type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    city: Optional[str] = Query(None, description="Filter by city"),
    state: Optional[str] = Query(None, description="Filter by state"),
    country: Optional[str] = Query(None, description="Filter by country"),
    include_deleted: bool = Query(False, description="Include deleted organizations"),
    sort_by: str = Query("created_at", description="Sort by field"),
    sort_order: str = Query("desc", description="Sort order (asc/desc)"),
    db: Session = Depends(get_db)
):
    """Get all organizations with filtering and pagination"""
    try:
        from app.schemas.organization import OrganizationFilter
        
        filters = OrganizationFilter(
            name=name,
            org_type=org_type,
            status=status,
            city=city,
            state=state,
            country=country,
            is_deleted=include_deleted
        )
        
        return get_organizations(db, skip, limit, filters, sort_by, sort_order)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch organizations: {str(e)}"
        )


@router.get("/search", response_model=list[OrganizationResponse])
async def search_orgs(
    q: str = Query(..., description="Search term"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results"),
    db: Session = Depends(get_db)
):
    """Search organizations by name, description, or other fields"""
    try:
        return search_organizations(db, q, limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: int,
    include_deleted: bool = Query(False, description="Include deleted organizations"),
    db: Session = Depends(get_db)
):
    """Get organization by ID"""
    try:
        org = get_organization_by_id(db, org_id, include_deleted)
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found"
            )
        return org
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch organization: {str(e)}"
        )


@router.put("/{org_id}", response_model=OrganizationResponse)
async def update_org(
    org_id: int,
    organization_update: OrganizationUpdate,
    db: Session = Depends(get_db)
):
    """Update an organization"""
    try:
        return update_organization(db, org_id, organization_update)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update organization: {str(e)}"
        )


@router.delete("/{org_id}")
async def delete_organization(
    org_id: int,
    delete_request: OrganizationDelete,
    db: Session = Depends(get_db)
):
    """Soft delete an organization"""
    try:
        success = soft_delete_organization(db, org_id, delete_request.deleted_by)
        if success:
            return {"message": "Organization deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete organization"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete organization: {str(e)}"
        )


@router.post("/{org_id}/restore", response_model=OrganizationResponse)
async def restore_org(
    org_id: int,
    restored_by: Optional[str] = Query(None, description="User who restored the organization"),
    db: Session = Depends(get_db)
):
    """Restore a soft-deleted organization"""
    try:
        return restore_organization(db, org_id, restored_by)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restore organization: {str(e)}"
        )
