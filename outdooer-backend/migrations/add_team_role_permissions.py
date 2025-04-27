"""
Migration script to add team_role_permissions table to the database

This script adds the team_role_permissions table which allows for team-specific
role-based permission management.

Usage:
    python -m migrations.add_team_role_permissions
"""

import os
import sys
from pathlib import Path

# Add the parent directory to path to import application modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from flask import Flask
from app import create_app, db
from sqlalchemy import text

def run_migration():
    """Run the migration to add team_role_permissions table"""
    try:
        app = create_app(os.getenv('FLASK_ENV', 'development'))
        
        with app.app_context():
            # Check if table already exists
            table_exists = False
            
            try:
                result = db.session.execute(text("SELECT 1 FROM information_schema.tables WHERE table_name = 'team_role_permissions'"))
                table_exists = result.scalar() is not None
            except Exception as e:
                print(f"Error checking if table exists: {e}")
                table_exists = False
            
            if table_exists:
                print("Table team_role_permissions already exists.")
                return
            
            # Create the team_role_permissions table
            sql = """
            CREATE TABLE IF NOT EXISTS public.team_role_permissions
            (
                permission_id serial NOT NULL,
                team_id integer REFERENCES teams(team_id),
                role_level integer NOT NULL,
                permission_key character varying(100) NOT NULL,
                is_enabled boolean DEFAULT false,
                modified_by integer REFERENCES users(user_id),
                modified_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT team_role_permissions_pkey PRIMARY KEY (permission_id),
                CONSTRAINT unique_team_role_permission UNIQUE (team_id, role_level, permission_key)
            );

            CREATE INDEX idx_team_role_permissions_team ON team_role_permissions(team_id);
            CREATE INDEX idx_team_role_permissions_role ON team_role_permissions(role_level);
            """
            
            db.session.execute(text(sql))
            db.session.commit()
            
            print("Successfully created team_role_permissions table.")
            
            # Import and run setup to populate with default permissions
            from app.scripts.setup_role_configurations import setup_team_role_permissions
            setup_team_role_permissions()
            print("Successfully initialized team role permissions.")
            
    except Exception as e:
        print(f"Error executing migration: {e}")
        return

if __name__ == '__main__':
    run_migration()