#!/usr/bin/env python3
"""
Script to fix user roles in the outdooer database

This script:
1. Checks all users with guide role and ensures they have explorer role
2. Assigns guide role to all users who are team members but don't have guide role
3. Verifies Master Guides have the guide role and correct team role level

Usage:
    python -m scripts.fix_user_roles [--dry-run]

Options:
    --dry-run       Show what would be changed without making changes
"""

import os
import sys
import argparse
from pathlib import Path

# Add the parent directory to path to import the application
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from flask import Flask
from app import create_app, db
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember

def fix_user_roles(dry_run=False):
    """Fix inconsistencies in user roles"""
    with app.app_context():
        print("\n=== User Role Consistency Check ===\n")
        
        # 1. Make sure all guides have explorer role
        guides_without_explorer = []
        guides = User.query.join(UserRole).filter(UserRole.role_type == 'guide').all()
        
        for guide in guides:
            has_explorer = UserRole.query.filter_by(user_id=guide.user_id, role_type='explorer').first() is not None
            if not has_explorer:
                guides_without_explorer.append(guide)
                
                if not dry_run:
                    # Add explorer role
                    explorer_role = UserRole(user_id=guide.user_id, role_type='explorer')
                    db.session.add(explorer_role)
        
        print(f"Found {len(guides_without_explorer)} guides without explorer role")
        if guides_without_explorer:
            print("Affected users:")
            for guide in guides_without_explorer:
                action = "Would add" if dry_run else "Added"
                print(f"  - {guide.email}: {action} explorer role")
        
        # 2. Make sure all team members have guide role
        team_members_without_guide = []
        members = db.session.query(User).join(TeamMember, User.user_id == TeamMember.user_id).all()
        
        for member in members:
            has_guide = UserRole.query.filter_by(user_id=member.user_id, role_type='guide').first() is not None
            if not has_guide:
                team_members_without_guide.append(member)
                
                if not dry_run:
                    # Add guide role
                    guide_role = UserRole(user_id=member.user_id, role_type='guide')
                    db.session.add(guide_role)
        
        print(f"\nFound {len(team_members_without_guide)} team members without guide role")
        if team_members_without_guide:
            print("Affected users:")
            for member in team_members_without_guide:
                action = "Would add" if dry_run else "Added"
                print(f"  - {member.email}: {action} guide role")
        
        # 3. Check master guides have correct team role level
        inconsistent_master_guides = []
        teams = Team.query.all()
        
        for team in teams:
            if team.master_guide_id:
                # Check if master guide has correct role level in team
                membership = TeamMember.query.filter_by(
                    team_id=team.team_id,
                    user_id=team.master_guide_id
                ).first()
                
                if not membership:
                    # Master guide not in team members
                    inconsistent_master_guides.append((team, "Not a team member"))
                    
                    if not dry_run:
                        # Add team membership with correct role level
                        new_membership = TeamMember(
                            team_id=team.team_id,
                            user_id=team.master_guide_id,
                            role_level=1
                        )
                        db.session.add(new_membership)
                
                elif membership.role_level != 1:
                    # Role level is not 1 (Master Guide)
                    inconsistent_master_guides.append((team, f"Role level is {membership.role_level} instead of 1"))
                    
                    if not dry_run:
                        # Set correct role level
                        membership.role_level = 1
                
                # Check if master guide has guide role
                master_guide = User.query.get(team.master_guide_id)
                has_guide = UserRole.query.filter_by(user_id=team.master_guide_id, role_type='guide').first() is not None
                
                if not has_guide:
                    inconsistent_master_guides.append((team, "Missing guide role"))
                    
                    if not dry_run:
                        # Add guide role
                        guide_role = UserRole(user_id=team.master_guide_id, role_type='guide')
                        db.session.add(guide_role)
        
        print(f"\nFound {len(inconsistent_master_guides)} inconsistent master guide configurations")
        if inconsistent_master_guides:
            print("Affected teams:")
            for team, issue in inconsistent_master_guides:
                master_guide = User.query.get(team.master_guide_id)
                action = "Would fix" if dry_run else "Fixed"
                print(f"  - Team: {team.team_name}, Master Guide: {master_guide.email}, Issue: {issue} ({action})")
        
        # Apply changes if not dry run
        if not dry_run:
            try:
                db.session.commit()
                print("\nAll changes committed to database successfully!")
            except Exception as e:
                db.session.rollback()
                print(f"\nError committing changes: {str(e)}")
        else:
            print("\nDRY RUN: No changes were made to the database.")
            
        print("\n=== User Role Check Complete ===")


if __name__ == '__main__':
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Fix user roles in the outdooer database')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be changed without making changes')
    args = parser.parse_args()
    
    # Create Flask app
    app = create_app(os.getenv('FLASK_ENV', 'development'))
    
    # Fix user roles
    fix_user_roles(dry_run=args.dry_run)