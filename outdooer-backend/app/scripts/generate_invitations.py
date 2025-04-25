#!/usr/bin/env python3
"""
Script to generate test invitation codes for Outdooer API

This script creates 5 test invitation codes:
1. A master guide code (team leader)
2. Three regular guide codes for teams
3. A multi-use guide code

Usage:
    python -m scripts.generate_invitations
"""

import os
import sys
from pathlib import Path

# Add parent directory to path to import application modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app, db
from app.models.user import User
from app.models.team import Team
from app.models.invitation import InvitationCode
from datetime import datetime, timedelta

def generate_invitation_codes(app):
    """Generate 5 test invitation codes for testing"""
    with app.app_context():
        # Get admin user and a team
        admin = User.query.filter_by(email='admin@outdooer.com').first()
        if not admin:
            print("Admin user not found. Make sure to run init_db.py first.")
            return
            
        # Get a team for team-specific invitations
        team = Team.query.first()
        if not team:
            print("No teams found. Make sure to run init_db.py with --sample-data.")
            return
            
        # Create invitation codes
        codes = []
        
        # 1. Master Guide invitation (team leader)
        master_code = InvitationCode.generate_code(
            role_type='master_guide',
            expires_in_days=60, 
            created_by=admin.user_id
        )
        codes.append(master_code)
        
        # 2-4. Three Regular Guide invitations
        for i in range(3):
            guide_code = InvitationCode.generate_code(
                role_type='guide',
                team_id=team.team_id,
                expires_in_days=30,
                created_by=admin.user_id
            )
            codes.append(guide_code)
            
        # 5. Multi-use Guide invitation
        multi_code = InvitationCode.generate_code(
            role_type='guide',
            team_id=team.team_id,
            max_uses=5,
            expires_in_days=90,
            created_by=admin.user_id
        )
        codes.append(multi_code)
        
        # Add codes to database
        for code in codes:
            db.session.add(code)
            
        try:
            db.session.commit()
            print(f"Successfully created {len(codes)} invitation codes:")
            for code in codes:
                print(f"- {code.code}: {code.role_type}, Expires: {code.expires_at.strftime('%Y-%m-%d')}, Max Uses: {code.max_uses}")
        except Exception as e:
            db.session.rollback()
            print(f"Error creating invitation codes: {str(e)}")

if __name__ == "__main__":
    # Get environment from command line or default to development
    config_name = os.getenv('FLASK_ENV', 'development')
    
    # Create Flask application
    app = create_app(config_name)
    
    # Generate codes
    generate_invitation_codes(app)