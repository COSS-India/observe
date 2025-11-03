from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="customer")
    username = Column(String(100), nullable=True)
    
    # Additional fields from sample response
    designation = Column(String(100), nullable=True)
    gender = Column(String(20), nullable=True)
    email_id = Column(String(255), nullable=True)  # Official email
    personal_email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    status = Column(String(50), default="Engaged")
    user_type = Column(JSON, nullable=True)
    product_access = Column(JSON, nullable=True)
    additional_contacts = Column(JSON, nullable=True)
    is_fresh = Column(Boolean, default=True)
    is_profile_updated = Column(Boolean, default=False)
    is_existing_user = Column(Boolean, default=False)
    is_exisiting_user = Column(Boolean, default=False)  # Typo in original API
    is_test_user = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    deleted_on = Column(DateTime(timezone=True), nullable=True)
    pending_req_count = Column(Integer, default=0)
    last_login = Column(DateTime(timezone=True), nullable=True)
    tnc_url = Column(Text, nullable=True)
    tnc_accepted = Column(Boolean, default=False)
    is_parichay = Column(Boolean, default=False)
    
    # Legacy fields
    org_type = Column(String(100), nullable=True)
    org_name = Column(String(255), nullable=True)
    org_details = Column(JSON, nullable=True)
    stage_completed = Column(String(100), nullable=True)
    is_external = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    org = relationship("Organization", back_populates="user", uselist=False)
    supervisor_details = relationship("SupervisorDetail", back_populates="user")
    mou_info = relationship("MouInfo", back_populates="user", uselist=False)
    reference_documents = relationship("ReferenceDocument", back_populates="user")
    associated_managers = relationship("AssociatedManager", back_populates="user")


class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    org_name = Column(String(255), nullable=False)
    org_type = Column(String(100), nullable=False)
    org_website = Column(String(500), nullable=True)
    
    # Org details
    ministry_name = Column(String(255), nullable=True)
    department_name = Column(String(255), nullable=True)
    
    # Address details
    address_type = Column(String(50), default="Primary")
    address = Column(Text, nullable=True)
    pincode = Column(String(10), nullable=True)
    state = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="org")


class SupervisorDetail(Base):
    __tablename__ = "supervisor_details"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    official_email = Column(String(255), nullable=False)
    designation = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    id_proof = Column(String(500), nullable=True)  # File path or blob reference
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="supervisor_details")


class MouInfo(Base):
    __tablename__ = "mou_infos"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mou_format = Column(String(100), nullable=True)
    mou_custom_file_upload = Column(String(500), nullable=True)
    mou_custom_filename = Column(String(255), nullable=True)
    mou_status = Column(String(100), default="MoU Not Requested")
    remarks = Column(Text, nullable=True)
    mou_requested_by = Column(String(255), nullable=True)
    requested_on = Column(DateTime(timezone=True), nullable=True)
    updated_on = Column(DateTime(timezone=True), nullable=True)
    is_deleted = Column(Boolean, default=False)
    deleted_on = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="mou_info")


class ReferenceDocument(Base):
    __tablename__ = "reference_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    blob_file_name = Column(String(500), nullable=False)
    role = Column(String(50), nullable=False)
    uploaded_by = Column(String(255), nullable=False)
    uploaded_on = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="reference_documents")


class AssociatedManager(Base):
    __tablename__ = "associated_managers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    application_name = Column(String(255), nullable=False)
    manager_email = Column(String(255), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="associated_managers")


class Captcha(Base):
    __tablename__ = "captchas"

    id = Column(Integer, primary_key=True, index=True)
    captcha_id = Column(String(50), unique=True, index=True, nullable=False)
    captcha_text = Column(String(20), nullable=False)
    image_data = Column(Text, nullable=False)  # Base64 encoded image
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False)


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    grafana_team_id = Column(Integer, nullable=False, unique=True, index=True)
    team_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    team_organizations = relationship("TeamOrganization", back_populates="team", cascade="all, delete-orphan")


class TeamOrganization(Base):
    __tablename__ = "team_organizations"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    team = relationship("Team", back_populates="team_organizations")
    organization = relationship("Organization")
