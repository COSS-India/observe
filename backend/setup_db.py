#!/usr/bin/env python3
"""
Database setup script for Adopter Login API
This script handles different PostgreSQL configurations
"""

import sys
import os
import subprocess
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_postgresql_connection():
    """Test different PostgreSQL connection configurations"""
    configs = [
        "postgresql://postgres:@localhost:5432/postgres",
        "postgresql://postgres:postgres@localhost:5432/postgres", 
        "postgresql://postgres:password@localhost:5432/postgres",
        "postgresql://localhost:5432/postgres",
    ]
    
    for config in configs:
        try:
            print(f"Testing connection: {config}")
            conn = psycopg2.connect(config)
            conn.close()
            print(f"✅ Connection successful with: {config}")
            return config.replace("/postgres", "/adopter")
        except Exception as e:
            print(f"❌ Failed: {e}")
            continue
    
    return None

def create_database(connection_string):
    """Create the adopter database"""
    try:
        # Connect to postgres database to create adopter
        base_conn_str = connection_string.replace("/adopter", "/postgres")
        conn = psycopg2.connect(base_conn_str)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = 'adopter'")
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute("CREATE DATABASE adopter")
            print("✅ Database 'adopter' created successfully!")
        else:
            print("✅ Database 'adopter' already exists!")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False

def update_config_file(connection_string):
    """Update the config file with working connection string"""
    config_file = "app/core/config.py"
    
    try:
        with open(config_file, 'r') as f:
            content = f.read()
        
        # Replace the DATABASE_URL line
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if 'DATABASE_URL: str =' in line:
                lines[i] = f'    DATABASE_URL: str = "{connection_string}"'
                break
        
        with open(config_file, 'w') as f:
            f.write('\n'.join(lines))
        
        print(f"✅ Updated config file with: {connection_string}")
        return True
        
    except Exception as e:
        print(f"❌ Error updating config file: {e}")
        return False

def main():
    """Main function"""
    print("PostgreSQL Database Setup for Adopter Login API")
    print("=" * 60)
    
    # Test PostgreSQL connection
    print("Testing PostgreSQL connections...")
    working_config = test_postgresql_connection()
    
    if not working_config:
        print("\n❌ Could not connect to PostgreSQL!")
        print("\nPlease ensure PostgreSQL is installed and running:")
        print("1. Install PostgreSQL: sudo apt install postgresql postgresql-contrib")
        print("2. Start PostgreSQL: sudo systemctl start postgresql")
        print("3. Set postgres password: sudo -u postgres psql -c \"ALTER USER postgres PASSWORD 'your_password';\"")
        print("4. Or create a user: sudo -u postgres createuser -s your_username")
        sys.exit(1)
    
    # Create database
    print(f"\nCreating database with: {working_config}")
    if not create_database(working_config):
        sys.exit(1)
    
    # Update config file
    print(f"\nUpdating configuration...")
    if not update_config_file(working_config):
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("✅ Database setup completed successfully!")
    print("You can now run: python init_db.py")
    print("=" * 60)

if __name__ == "__main__":
    main()



