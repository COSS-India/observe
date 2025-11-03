"""
Migration script to create teams and team_organizations tables
Run this script to create the new tables in the database
"""
from app.core.database import engine, Base
from app.models.user import Team, TeamOrganization

def migrate():
    """Create teams and team_organizations tables"""
    print("Creating teams and team_organizations tables...")

    try:
        # Create all tables (will only create missing ones)
        Base.metadata.create_all(bind=engine)
        print("✓ Tables created successfully!")
        print("  - teams")
        print("  - team_organizations")
    except Exception as e:
        print(f"✗ Error creating tables: {e}")
        raise

if __name__ == "__main__":
    migrate()
