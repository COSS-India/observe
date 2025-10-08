#!/usr/bin/env python3
"""
Database initialization script for Bhashini Login API
Run this script to create the database tables and add sample data
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.user import User
from app.utils.security import get_password_hash

def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

def create_sample_user():
    """Create a sample user for testing"""
    db = SessionLocal()
    try:
        # Check if sample user already exists
        existing_user = db.query(User).filter(User.email == "test@karmayogi.in").first()
        if existing_user:
            print("Sample user already exists!")
            return
        
        # Create sample user
        sample_user = User(
            first_name="Test",
            last_name="User",
            email="test@karmayogi.in",
            password_hash=get_password_hash("test1234"),
            role="customer",
            username="test",
            org_type="Central Government",
            org_name="Test Organization",
            org_details={
                "industry_type": "Information Technology (IT)",
                "is_startup": False,
                "is_dpiit_certified": False,
                "is_interested_in_api_integration": False
            },
            is_fresh=False,
            is_profile_updated=True,
            is_existing_user=False,
            is_external=False
        )
        
        db.add(sample_user)
        db.commit()
        print("Sample user created successfully!")
        print("Email: test@karmayogi.in")
        print("Password: test1234")
        
    except Exception as e:
        print(f"Error creating sample user: {e}")
        db.rollback()
    finally:
        db.close()

def main():
    """Main function"""
    print("Initializing Bhashini Login API Database...")
    print("=" * 50)
    
    try:
        create_tables()
        create_sample_user()
        print("=" * 50)
        print("Database initialization completed successfully!")
        
    except Exception as e:
        print(f"Error during initialization: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
