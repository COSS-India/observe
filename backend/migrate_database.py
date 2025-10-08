#!/usr/bin/env python3
"""
Database migration script to add new tables for comprehensive user profile
Run this script to create the new tables in your database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.database import Base
from app.models.user import User, Organization, SupervisorDetail, MouInfo, ReferenceDocument, AssociatedManager, Captcha

def create_tables():
    """Create all tables"""
    engine = create_engine(settings.DATABASE_URL)
    
    print("Creating new tables...")
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully!")
        
        # List created tables
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """))
            tables = [row[0] for row in result]
            
            print("\n📋 Created tables:")
            for table in tables:
                print(f"  - {table}")
                
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False
    
    return True

def add_missing_columns():
    """Add missing columns to existing users table"""
    engine = create_engine(settings.DATABASE_URL)
    
    print("\nAdding missing columns to users table...")
    
    missing_columns = [
        "designation VARCHAR(100)",
        "gender VARCHAR(20)",
        "email_id VARCHAR(255)",
        "personal_email VARCHAR(255)",
        "phone VARCHAR(20)",
        "status VARCHAR(50) DEFAULT 'Engaged'",
        "product_access JSON",
        "additional_contacts JSON",
        "is_exisiting_user BOOLEAN DEFAULT FALSE",
        "is_test_user BOOLEAN DEFAULT FALSE",
        "is_deleted BOOLEAN DEFAULT FALSE",
        "deleted_on TIMESTAMP WITH TIME ZONE",
        "pending_req_count INTEGER DEFAULT 0",
        "last_login TIMESTAMP WITH TIME ZONE",
        "tnc_accepted BOOLEAN DEFAULT FALSE",
        "is_parichay BOOLEAN DEFAULT FALSE"
    ]
    
    try:
        with engine.connect() as conn:
            for column in missing_columns:
                try:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {column};"))
                    print(f"  ✅ Added column: {column.split()[0]}")
                except Exception as e:
                    print(f"  ⚠️  Column might already exist: {column.split()[0]} - {e}")
            
            conn.commit()
            print("✅ Missing columns added successfully!")
            
    except Exception as e:
        print(f"❌ Error adding columns: {e}")
        return False
    
    return True

def main():
    """Main migration function"""
    print("🚀 Starting database migration...")
    print("=" * 50)
    
    # Create new tables
    if not create_tables():
        print("❌ Migration failed!")
        return False
    
    # Add missing columns to users table
    if not add_missing_columns():
        print("❌ Migration failed!")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 Migration completed successfully!")
    print("\n📝 Next steps:")
    print("1. Update your existing user records with the new fields")
    print("2. Test the new API endpoints:")
    print("   - GET /api/v1/auth/users")
    print("   - GET /api/v1/auth/users/{user_id}")
    print("   - GET /api/v1/auth/users/email/{email}")
    
    return True

if __name__ == "__main__":
    main()



