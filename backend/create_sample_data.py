#!/usr/bin/env python3
"""
Sample data script to populate the database with test data
This will create sample users with all the related data structures
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, Organization, SupervisorDetail, MouInfo, ReferenceDocument, AssociatedManager
from app.utils.security import get_password_hash
from datetime import datetime, timedelta

def create_sample_data():
    """Create sample data for testing"""
    
    # Get database session
    db = next(get_db())
    
    try:
        print("Creating sample data...")
        
        # Create sample user 1
        user1 = User(
            first_name="John",
            last_name="Doe",
            email="john.doe@example.com",
            email_id="john.doe@karmayogi.in",
            personal_email="john.doe@gmail.com",
            password_hash=get_password_hash("password123"),
            designation="CPO",
            gender="male",
            phone="1234567890",
            status="Engaged",
            role="customer",
            user_type=["government"],
            product_access=["Bhashini Translation Plugin", "Udyat"],
            is_fresh=False,
            is_profile_updated=True,
            is_existing_user=False,
            is_exisiting_user=False,
            is_test_user=False,
            is_deleted=False,
            pending_req_count=0,
            tnc_accepted=True,
            is_parichay=False,
            created_at=datetime.utcnow() - timedelta(days=30),
            updated_at=datetime.utcnow() - timedelta(days=1)
        )
        
        db.add(user1)
        db.flush()  # Get the user ID
        
        # Create organization for user1
        org1 = Organization(
            user_id=user1.id,
            org_name="Karmayogi Bharat",
            org_type="Central Government",
            org_website="https://igotkarmayogi.gov.in/#/",
            ministry_name="Ministry of Personnel, Public Grievances and Pensions",
            department_name="Department of Personnel and Training",
            address_type="Primary",
            address="Capital Tower 7th Floor, Vir Marg, Sector 4, Market, New Delhi, Delhi 110001",
            pincode="110001",
            state="Delhi",
            city="CENTRAL DELHI"
        )
        
        db.add(org1)
        
        # Create supervisor details for user1
        supervisor1 = SupervisorDetail(
            user_id=user1.id,
            first_name="Jane",
            last_name="Smith",
            official_email="jane.smith@tarento.com",
            designation="Product Manager",
            phone="1234567890",
            id_proof="234e57db-9938-421c-8330-328907055b66.pdf"
        )
        
        db.add(supervisor1)
        
        # Create MOU info for user1
        mou1 = MouInfo(
            user_id=user1.id,
            mou_format="",
            mou_custom_file_upload=None,
            mou_custom_filename=None,
            mou_status="MoU Not Requested",
            remarks="",
            mou_requested_by="",
            requested_on=None,
            updated_on=None,
            is_deleted=False,
            deleted_on=None
        )
        
        db.add(mou1)
        
        # Create reference document for user1
        ref_doc1 = ReferenceDocument(
            user_id=user1.id,
            file_name="IMG_8131.pdf",
            blob_file_name="234e57db-9938-421c-8330-328907055b66.pdf",
            role="customer",
            uploaded_by="John Doe",
            uploaded_on=datetime.utcnow() - timedelta(days=1)
        )
        
        db.add(ref_doc1)
        
        # Create associated managers for user1
        manager1 = AssociatedManager(
            user_id=user1.id,
            application_name="Bhashini Translation Plugin",
            manager_email="manager1@digitalindia.gov.in"
        )
        
        manager2 = AssociatedManager(
            user_id=user1.id,
            application_name="Udyat",
            manager_email="manager2@digitalindia.gov.in"
        )
        
        db.add(manager1)
        db.add(manager2)
        
        # Create sample user 2
        user2 = User(
            first_name="Alice",
            last_name="Johnson",
            email="alice.johnson@example.com",
            email_id="alice.johnson@startup.in",
            personal_email="alice.johnson@gmail.com",
            password_hash=get_password_hash("password123"),
            designation="CTO",
            gender="female",
            phone="9876543210",
            status="Engaged",
            role="customer",
            user_type=["startup"],
            product_access=["Bhashini Translation Plugin"],
            is_fresh=True,
            is_profile_updated=False,
            is_existing_user=False,
            is_exisiting_user=False,
            is_test_user=False,
            is_deleted=False,
            pending_req_count=2,
            tnc_accepted=True,
            is_parichay=False,
            created_at=datetime.utcnow() - timedelta(days=7),
            updated_at=datetime.utcnow()
        )
        
        db.add(user2)
        db.flush()
        
        # Create organization for user2
        org2 = Organization(
            user_id=user2.id,
            org_name="TechStart Solutions",
            org_type="Startup",
            org_website="https://techstart.com",
            ministry_name=None,
            department_name=None,
            address_type="Primary",
            address="Tech Park, Bangalore, Karnataka 560001",
            pincode="560001",
            state="Karnataka",
            city="Bangalore"
        )
        
        db.add(org2)
        
        # Create MOU info for user2
        mou2 = MouInfo(
            user_id=user2.id,
            mou_format="Standard",
            mou_custom_file_upload=None,
            mou_custom_filename=None,
            mou_status="MoU Requested",
            remarks="Pending approval",
            mou_requested_by="Alice Johnson",
            requested_on=datetime.utcnow() - timedelta(days=3),
            updated_on=datetime.utcnow() - timedelta(days=1),
            is_deleted=False,
            deleted_on=None
        )
        
        db.add(mou2)
        
        # Commit all changes
        db.commit()
        
        print("✅ Sample data created successfully!")
        print(f"Created user 1: {user1.first_name} {user1.last_name} (ID: {user1.id})")
        print(f"Created user 2: {user2.first_name} {user2.last_name} (ID: {user2.id})")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating sample data: {e}")
        return False
    finally:
        db.close()

def main():
    """Main function"""
    print("🚀 Creating sample data...")
    print("=" * 40)
    
    if create_sample_data():
        print("\n🎉 Sample data creation completed!")
        print("\n📝 You can now test the APIs:")
        print("1. GET /api/v1/auth/users - Get all users")
        print("2. GET /api/v1/auth/users/1 - Get user by ID")
        print("3. GET /api/v1/auth/users/email/john.doe@example.com - Get user by email")
    else:
        print("\n❌ Sample data creation failed!")

if __name__ == "__main__":
    main()



