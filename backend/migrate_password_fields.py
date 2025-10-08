#!/usr/bin/env python3
"""
Migration script to add password management fields to users table
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_password_fields():
    """Add password management fields to users table"""
    
    try:
        with engine.connect() as conn:
            # Check if columns already exist
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name IN ('temp_password_expires_at', 'password_reset_token', 'password_reset_expires_at')
            """))
            
            existing_columns = [row[0] for row in result]
            
            # Add temp_password_expires_at column
            if 'temp_password_expires_at' not in existing_columns:
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN temp_password_expires_at TIMESTAMP WITH TIME ZONE
                """))
                logger.info("Added temp_password_expires_at column")
            else:
                logger.info("temp_password_expires_at column already exists")
            
            # Add password_reset_token column
            if 'password_reset_token' not in existing_columns:
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN password_reset_token VARCHAR(255)
                """))
                logger.info("Added password_reset_token column")
            else:
                logger.info("password_reset_token column already exists")
            
            # Add password_reset_expires_at column
            if 'password_reset_expires_at' not in existing_columns:
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN password_reset_expires_at TIMESTAMP WITH TIME ZONE
                """))
                logger.info("Added password_reset_expires_at column")
            else:
                logger.info("password_reset_expires_at column already exists")
            
            # Commit the transaction
            conn.commit()
            
            logger.info("✅ Password management fields migration completed successfully!")
            return True
            
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Running password management fields migration...")
    print("=" * 50)
    
    if migrate_password_fields():
        print("\n🎉 Migration completed successfully!")
        print("\n📝 New fields added to users table:")
        print("- temp_password_expires_at: Tracks when temporary passwords expire")
        print("- password_reset_token: Stores password reset tokens")
        print("- password_reset_expires_at: Tracks when reset tokens expire")
    else:
        print("\n❌ Migration failed!")

if __name__ == "__main__":
    main()



