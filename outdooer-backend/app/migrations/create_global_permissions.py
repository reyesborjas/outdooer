# migrations/create_global_permissions.py
"""
Migration script to create global permissions in the team_role_permissions table

This script sets up the global permissions (where team_id is NULL) in the
team_role_permissions table.

Usage:
    python -m migrations.create_global_permissions
"""

import os
import sys
from pathlib import Path

# Add the parent directory to path to import application modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from flask import Flask
from app import create_app, db
from app.models.team_role_permissions import TeamRolePermissions
from app.models.user import User

def run_migration():
    """Run the migration to create global permissions"""
    try:
        app = create_app(os.getenv('FLASK_ENV', 'development'))
        
        with app.app_context():
            # Get an admin user for 'modified_by'
            admin = User.query.filter_by(email='admin@outdooer.com').first()
            modified_by = admin.user_id if admin else None
            
            # Check if global permissions already exist
            existing_globals = TeamRolePermissions.query.filter_by(team_id=None).count()
            if existing_globals > 0:
                print(f"{existing_globals} global permissions already exist. Skipping creation.")
                return
            
            # Define default global permissions for each role level
            default_permissions = {
                # Master Guide (Level 1) - Full access
                1: [
                    {'key': 'create_expedition', 'enabled': True},
                    {'key': 'update_expedition', 'enabled': True},
                    {'key': 'delete_expedition', 'enabled': True},
                    {'key': 'create_activity', 'enabled': True},
                    {'key': 'update_activity', 'enabled': True},
                    {'key': 'delete_activity', 'enabled': True},
                    {'key': 'manage_team', 'enabled': True},
                    {'key': 'manage_team_members', 'enabled': True},
                    {'key': 'manage_resources', 'enabled': True},
                    {'key': 'manage_revenue', 'enabled': True}
                ],
                # Tactical Guide (Level 2) - Can manage most things except deletion
                2: [
                    {'key': 'create_expedition', 'enabled': True},
                    {'key': 'update_expedition', 'enabled': True},
                    {'key': 'delete_expedition', 'enabled': False},
                    {'key': 'create_activity', 'enabled': True},
                    {'key': 'update_activity', 'enabled': True},
                    {'key': 'delete_activity', 'enabled': False},
                    {'key': 'manage_team', 'enabled': False},
                    {'key': 'manage_team_members', 'enabled': True},
                    {'key': 'manage_resources', 'enabled': True},
                    {'key': 'manage_revenue', 'enabled': False}
                ],
                # Technical Guide (Level 3) - Can create and update their own
                3: [
                    {'key': 'create_expedition', 'enabled': False},
                    {'key': 'update_expedition', 'enabled': True},  # Own expeditions only
                    {'key': 'delete_expedition', 'enabled': False},
                    {'key': 'create_activity', 'enabled': True},
                    {'key': 'update_activity', 'enabled': True},  # Own activities only
                    {'key': 'delete_activity', 'enabled': False},
                    {'key': 'manage_team', 'enabled': False},
                    {'key': 'manage_team_members', 'enabled': False},
                    {'key': 'manage_resources', 'enabled': True},
                    {'key': 'manage_revenue', 'enabled': False}
                ],
                # Base Guide (Level 4) - Limited permissions
                4: [
                    {'key': 'create_expedition', 'enabled': False},
                    {'key': 'update_expedition', 'enabled': False},
                    {'key': 'delete_expedition', 'enabled': False},
                    {'key': 'create_activity', 'enabled': True},
                    {'key': 'update_activity', 'enabled': True},  # Own activities only
                    {'key': 'delete_activity', 'enabled': False},
                    {'key': 'manage_team', 'enabled': False},
                    {'key': 'manage_team_members', 'enabled': False},
                    {'key': 'manage_resources', 'enabled': False},
                    {'key': 'manage_revenue', 'enabled': False}
                ]
            }
            
            # Create global permissions for each role level
            permissions_created = 0
            
            for role_level, permissions in default_permissions.items():
                for perm in permissions:
                    global_perm = TeamRolePermissions(
                        team_id=None,  # NULL for global permissions
                        role_level=role_level,
                        permission_key=perm['key'],
                        is_enabled=perm['enabled'],
                        modified_by=modified_by
                    )
                    db.session.add(global_perm)
                    permissions_created += 1
            
            db.session.commit()
            print(f"Successfully created {permissions_created} global permissions.")
            
    except Exception as e:
        db.session.rollback()
        print(f"Error creating global permissions: {e}")

if __name__ == '__main__':
    run_migration()