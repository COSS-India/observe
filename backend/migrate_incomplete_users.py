#!/usr/bin/env python3
"""
Migration script to populate missing data for incomplete users
"""

from sqlalchemy.orm import Session
from app.core.database import engine, get_db
from app.models.user import User, Organization
from app.services.user_service import get_all_users

def migrate_incomplete_users():
    """Migrate incomplete users to have basic organization data"""
    
    db = Session(engine)
    
    try:
        # Get all users
        users = db.query(User).all()
        
        migrated_count = 0
        
        for user in users:
            # Check if user has organization data
            has_org = db.query(Organization).filter(Organization.user_id == user.id).first()
            
            if not has_org and user.org_name and user.org_type:
                # Create organization record for users with basic org info
                organization = Organization(
                    user_id=user.id,
                    org_name=user.org_name,
                    org_type=user.org_type,
                    org_website=None,
                    ministry_name=None,
                    department_name=None,
                    address_type="Primary",
                    address=None,
                    pincode=None,
                    state=None,
                    city=None
                )
                
                db.add(organization)
                migrated_count += 1
                
                print(f"Migrated user {user.id}: {user.email}")
        
        db.commit()
        print(f"Successfully migrated {migrated_count} users")
        
    except Exception as e:
        db.rollback()
        print(f"Migration failed: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_incomplete_users()
