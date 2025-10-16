from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from app.models.organization import OrganizationCRUD
from app.schemas.organization import (
    OrganizationCreate, 
    OrganizationUpdate, 
    OrganizationResponse, 
    OrganizationListResponse,
    OrganizationFilter
)
from fastapi import HTTPException, status
from typing import List, Optional
from datetime import datetime


def create_organization(db: Session, organization: OrganizationCreate) -> OrganizationResponse:
    """Create a new organization"""
    
    # Check if organization with same name already exists
    existing_org = db.query(OrganizationCRUD).filter(
        OrganizationCRUD.name == organization.name,
        OrganizationCRUD.is_deleted == False
    ).first()
    
    if existing_org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization with this name already exists"
        )
    
    # Create new organization
    db_organization = OrganizationCRUD(
        name=organization.name,
        description=organization.description,
        org_type=organization.org_type,
        website=organization.website,
        email=organization.email,
        phone=organization.phone,
        address=organization.address,
        city=organization.city,
        state=organization.state,
        country=organization.country,
        pincode=organization.pincode,
        status=organization.status or "active",
        org_metadata=organization.org_metadata,
        created_by=organization.created_by
    )
    
    db.add(db_organization)
    db.commit()
    db.refresh(db_organization)
    
    return OrganizationResponse.from_orm(db_organization)


def get_organization_by_id(db: Session, org_id: int, include_deleted: bool = False) -> Optional[OrganizationResponse]:
    """Get organization by ID"""
    query = db.query(OrganizationCRUD).filter(OrganizationCRUD.id == org_id)
    
    if not include_deleted:
        query = query.filter(OrganizationCRUD.is_deleted == False)
    
    organization = query.first()
    
    if not organization:
        return None
    
    return OrganizationResponse.from_orm(organization)


def get_organization_by_name(db: Session, name: str, include_deleted: bool = False) -> Optional[OrganizationResponse]:
    """Get organization by name"""
    query = db.query(OrganizationCRUD).filter(OrganizationCRUD.name == name)
    
    if not include_deleted:
        query = query.filter(OrganizationCRUD.is_deleted == False)
    
    organization = query.first()
    
    if not organization:
        return None
    
    return OrganizationResponse.from_orm(organization)


def get_organizations(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    filters: Optional[OrganizationFilter] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc"
) -> OrganizationListResponse:
    """Get organizations with filtering, pagination and sorting"""
    
    query = db.query(OrganizationCRUD)
    
    # Apply filters
    if filters:
        if filters.name:
            query = query.filter(OrganizationCRUD.name.ilike(f"%{filters.name}%"))
        
        if filters.org_type:
            query = query.filter(OrganizationCRUD.org_type == filters.org_type)
        
        if filters.status:
            query = query.filter(OrganizationCRUD.status == filters.status)
        
        if filters.city:
            query = query.filter(OrganizationCRUD.city.ilike(f"%{filters.city}%"))
        
        if filters.state:
            query = query.filter(OrganizationCRUD.state.ilike(f"%{filters.state}%"))
        
        if filters.country:
            query = query.filter(OrganizationCRUD.country.ilike(f"%{filters.country}%"))
        
        if filters.created_by:
            query = query.filter(OrganizationCRUD.created_by == filters.created_by)
        
        if filters.created_after:
            query = query.filter(OrganizationCRUD.created_at >= filters.created_after)
        
        if filters.created_before:
            query = query.filter(OrganizationCRUD.created_at <= filters.created_before)
        
        if filters.is_deleted is not None:
            query = query.filter(OrganizationCRUD.is_deleted == filters.is_deleted)
    else:
        # Default: exclude deleted organizations
        query = query.filter(OrganizationCRUD.is_deleted == False)
    
    # Apply sorting
    if hasattr(OrganizationCRUD, sort_by):
        if sort_order.lower() == "desc":
            query = query.order_by(desc(getattr(OrganizationCRUD, sort_by)))
        else:
            query = query.order_by(asc(getattr(OrganizationCRUD, sort_by)))
    else:
        # Default sorting
        query = query.order_by(desc(OrganizationCRUD.created_at))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    organizations = query.offset(skip).limit(limit).all()
    
    # Convert to response format
    org_responses = [OrganizationResponse.from_orm(org) for org in organizations]
    
    return OrganizationListResponse(
        organizations=org_responses,
        total=total,
        page=(skip // limit) + 1,
        per_page=limit
    )


def update_organization(db: Session, org_id: int, organization_update: OrganizationUpdate) -> OrganizationResponse:
    """Update an organization"""
    
    # Get existing organization
    db_organization = db.query(OrganizationCRUD).filter(
        OrganizationCRUD.id == org_id,
        OrganizationCRUD.is_deleted == False
    ).first()
    
    if not db_organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Check if name is being changed and if new name already exists
    if organization_update.name and organization_update.name != db_organization.name:
        existing_org = db.query(OrganizationCRUD).filter(
            OrganizationCRUD.name == organization_update.name,
            OrganizationCRUD.id != org_id,
            OrganizationCRUD.is_deleted == False
        ).first()
        
        if existing_org:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization with this name already exists"
            )
    
    # Update fields
    update_data = organization_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_organization, field, value)
    
    # Update timestamp
    db_organization.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_organization)
    
    return OrganizationResponse.from_orm(db_organization)


def soft_delete_organization(db: Session, org_id: int, deleted_by: Optional[str] = None) -> bool:
    """Soft delete an organization"""
    
    db_organization = db.query(OrganizationCRUD).filter(
        OrganizationCRUD.id == org_id,
        OrganizationCRUD.is_deleted == False
    ).first()
    
    if not db_organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Soft delete
    db_organization.is_deleted = True
    db_organization.deleted_at = datetime.utcnow()
    db_organization.deleted_by = deleted_by
    
    db.commit()
    
    return True


def restore_organization(db: Session, org_id: int, restored_by: Optional[str] = None) -> OrganizationResponse:
    """Restore a soft-deleted organization"""
    
    db_organization = db.query(OrganizationCRUD).filter(
        OrganizationCRUD.id == org_id,
        OrganizationCRUD.is_deleted == True
    ).first()
    
    if not db_organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deleted organization not found"
        )
    
    # Restore organization
    db_organization.is_deleted = False
    db_organization.deleted_at = None
    db_organization.deleted_by = None
    db_organization.updated_at = datetime.utcnow()
    db_organization.updated_by = restored_by
    
    db.commit()
    db.refresh(db_organization)
    
    return OrganizationResponse.from_orm(db_organization)


def hard_delete_organization(db: Session, org_id: int) -> bool:
    """Permanently delete an organization (use with caution)"""
    
    db_organization = db.query(OrganizationCRUD).filter(OrganizationCRUD.id == org_id).first()
    
    if not db_organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    db.delete(db_organization)
    db.commit()
    
    return True


def get_organizations_count(db: Session, include_deleted: bool = False) -> int:
    """Get total count of organizations"""
    query = db.query(OrganizationCRUD)
    
    if not include_deleted:
        query = query.filter(OrganizationCRUD.is_deleted == False)
    
    return query.count()


def search_organizations(db: Session, search_term: str, limit: int = 50) -> List[OrganizationResponse]:
    """Search organizations by name, description, or other fields"""
    
    query = db.query(OrganizationCRUD).filter(
        OrganizationCRUD.is_deleted == False,
        or_(
            OrganizationCRUD.name.ilike(f"%{search_term}%"),
            OrganizationCRUD.description.ilike(f"%{search_term}%"),
            OrganizationCRUD.org_type.ilike(f"%{search_term}%"),
            OrganizationCRUD.city.ilike(f"%{search_term}%"),
            OrganizationCRUD.state.ilike(f"%{search_term}%"),
            OrganizationCRUD.country.ilike(f"%{search_term}%")
        )
    ).order_by(desc(OrganizationCRUD.created_at)).limit(limit)
    
    organizations = query.all()
    
    return [OrganizationResponse.from_orm(org) for org in organizations]
