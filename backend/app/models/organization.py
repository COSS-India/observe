from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class OrganizationCRUD(Base):
    __tablename__ = "organizations_crud"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    org_type = Column(String(100), nullable=True)  # Government, Private, NGO, etc.
    website = Column(String(500), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    
    # Address information
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)
    
    # Status and metadata
    status = Column(String(50), default="active")  # active, inactive, suspended
    is_deleted = Column(Boolean, default=False)
    
    # Metadata tracking fields
    org_metadata = Column(JSON, nullable=True)  # Additional metadata as JSON
    
    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(255), nullable=True)  # User who created
    updated_by = Column(String(255), nullable=True)  # User who last updated
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by = Column(String(255), nullable=True)  # User who deleted
