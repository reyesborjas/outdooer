#!/usr/bin/env python3
"""
Reset Permissions Script for Outdooer

This script resets and initializes the permission system with the correct
role-based access controls for the application.

Usage:
    python reset_permissions.py [--team-id TEAM_ID]

Options:
    --team-id TEAM_ID   Reset permissions for a specific team only
"""

import os
import sys
import argparse
from pathlib import Path

# Add the parent directory to path to import application modules
sys.path.insert(0, str(Path(__file__).resolve().parent))

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Reset and initialize permissions')
    parser.add_argument('--team-id', type=int, help='Reset permissions for a specific team only')
    return parser.parse_args()

def reset_permissions(team_id=None):
    """
    Reset and initialize permissions
    
    Args:
        team_id: Optional team ID to reset permissions for a specific team only
    """
    from app import create_app
    from app.database import db
    from app.models.team_role_permissions import TeamRolePermissions
    from app.scripts.setup_role_configurations import setup_role_configurations, setup_team_role_permissions
    
    # Create application context
    app = create_app('development')
    
    with app.app_context():
        # If team_id is provided, reset only that team's permissions
        if team_id:
            print(f"Resetting permissions for team {team_id}...")
            
            # Delete existing team permissions
            deleted_count = TeamRolePermissions.query.filter_by(team_id=team_id).delete()
            print(f"Deleted {deleted_count} existing team permissions.")
            
            # Get team creator (Master Guide)
            from app.models.team import Team
            team = Team.query.get(team_id)
            
            if not team:
                print(f"Error: Team with ID {team_id} not found.")
                return False
                
            creator_id = team.master_guide_id
            
            # Create new team permissions based on global defaults
            setup_team_role_permissions(team_id, creator_id)
            print(f"New permissions created for team {team_id}.")
        
        else:
            print("Resetting global permissions...")
            
            # Delete all global permissions
            deleted_count = TeamRolePermissions.query.filter_by(team_id=None).delete()
            print(f"Deleted {deleted_count} existing global permissions.")
            
            # Create new global permissions
            setup_role_configurations()
            print("New global permissions created.")
            
            # Reset team-specific permissions as well
            from app.models.team import Team
            teams = Team.query.all()
            
            for team in teams:
                print(f"Resetting permissions for team {team.team_id}...")
                
                # Delete existing team permissions
                deleted_count = TeamRolePermissions.query.filter_by(team_id=team.team_id).delete()
                print(f"Deleted {deleted_count} existing team permissions.")
                
                # Create new team permissions
                setup_team_role_permissions(team.team_id, team.master_guide_id)
                print(f"New permissions created for team {team.team_id}.")
        
        # Commit the transaction
        db.session.commit()
        print("Permissions reset successfully!")
        return True

if __name__ == '__main__':
    args = parse_args()
    
    print("\n=== Outdooer Permissions Reset Tool ===\n")
    
    if args.team_id:
        print(f"Resetting permissions for team {args.team_id}...")
    else:
        print("Resetting all permissions (global and team-specific)...")
    
    success = reset_permissions(args.team_id)
    
    if success:
        print("\nPermissions reset completed successfully!")
    else:
        print("\nPermissions reset failed!")
        sys.exit(1)