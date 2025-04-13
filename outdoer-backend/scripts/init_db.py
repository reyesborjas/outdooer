#!/usr/bin/env python3
"""
Database Initialization Script for outdooer API

This script initializes the PostgreSQL database for the outdooer application:
1. Creates database tables based on SQLAlchemy models
2. Creates an admin user account
3. Adds initial required data (roles, permissions, etc.)
4. Optionally adds sample data for development/testing

Usage:
    python init_db.py [--sample-data] [--reset]

Options:
    --sample-data   Add sample data for development/testing
    --reset         Drop all tables and recreate (WARNING: Destroys all existing data)
"""

import os
import sys
import argparse
import datetime
from pathlib import Path

# Add parent directory to path so we can import the application
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Import Flask application and models
from flask import Flask
from app import create_app, db
from app.models.user import User, UserRole
from app.models.team import Team, TeamMember, TeamRoleConfiguration
from app.models.location import Location
from app.utils.security import generate_password_hash

def init_db(app, sample_data=False, reset=False):
    """Initialize the database with required and optional sample data"""
    with app.app_context():
        if reset:
            print("Dropping all tables... (this will delete ALL existing data)")
            db.drop_all()
            print("Tables dropped successfully")
        
        # Create tables
        print("Creating database tables...")
        db.create_all()
        print("Tables created successfully")
        
        # Check if admin user exists
        admin_exists = User.query.filter_by(email='admin@outdooer.com').first() is not None
        
        if not admin_exists:
            print("Creating admin user...")
            admin_user = User(
                email='admin@outdooer.com',
                password_hash=generate_password_hash('admin123'),  # Should be changed immediately
                first_name='Admin',
                last_name='User',
                date_of_birth=datetime.date(1986, 9, 7),
                profile_visibility=False,
                account_status='active'
            )
            db.session.add(admin_user)
            db.session.commit()
            
            # Add admin role to the user
            admin_role = UserRole(
                user_id=admin_user.user_id,
                role_type='admin'
            )
            db.session.add(admin_role)
            db.session.commit()
            print(f"Admin user created with ID: {admin_user.user_id}")
        else:
            print("Admin user already exists, skipping creation.")
        
        if sample_data:
            create_sample_data(app)
            
        print("Database initialization completed successfully!")

def create_sample_data(app):
    """Create sample data for development and testing"""
    with app.app_context():
        print("Creating sample data...")
        
        # Create sample users
        print("Creating sample users...")
        users = []
        for i in range(1, 6):
            user = User(
                email=f'user{i}@example.com',
                password_hash=generate_password_hash(f'password{i}'),
                first_name=f'User{i}',
                last_name=f'Sample',
                date_of_birth=datetime.date(1990, i, 1),
                profile_visibility=True,
                account_status='active'
            )
            db.session.add(user)
            users.append(user)
        
        # Create guide roles for users
        for user in users:
            guide_role = UserRole(
                user_id=user.user_id,
                role_type='guide'
            )
            db.session.add(guide_role)
            
            # Also add explorer role to some users
            if user.user_id % 2 == 0:
                explorer_role = UserRole(
                    user_id=user.user_id,
                    role_type='explorer'
                )
                db.session.add(explorer_role)
        
        db.session.commit()
        
        # Create sample locations
        print("Creating sample locations...")
        locations = [
            Location(
                location_name="Mount Everest Base Camp",
                location_type="camp",
                latitude=28.0025,
                longitude=86.8555,
                elevation_meters=5364,
                country_code="NP",
                region_code="P1",
                is_verified=True
            ),
            Location(
                location_name="Grand Canyon",
                location_type="park",
                latitude=36.1069,
                longitude=-112.1123,
                elevation_meters=2000,
                country_code="US",
                region_code="AZ",
                is_verified=True
            ),
            Location(
                location_name="Machu Picchu",
                location_type="archaeological_site",
                latitude=-13.1631,
                longitude=-72.5450,
                elevation_meters=2430,
                country_code="PE",
                region_code="CUZ",
                is_verified=True
            )
        ]
        
        for location in locations:
            db.session.add(location)
        
        # Create sample teams
        print("Creating sample teams...")
        teams = [
            Team(
                team_name="Alpine Explorers",
                master_guide_id=users[0].user_id
            ),
            Team(
                team_name="Canyon Adventures",
                master_guide_id=users[1].user_id
            )
        ]
        
        for team in teams:
            db.session.add(team)
        
        db.session.commit()
        
        # Add team members
        print("Adding team members...")
        # Add User2 and User4 to Alpine Explorers team
        team_members = [
            TeamMember(
                team_id=teams[0].team_id,
                user_id=users[0].user_id, 
                role_level=1  # Master Guide
            ),
            TeamMember(
                team_id=teams[0].team_id,
                user_id=users[2].user_id,
                role_level=2  # Tactical Guide
            ),
            TeamMember(
                team_id=teams[0].team_id,
                user_id=users[4].user_id,
                role_level=3  # Technical Guide
            ),
            # Canyon Adventures members
            TeamMember(
                team_id=teams[1].team_id,
                user_id=users[1].user_id,
                role_level=1  # Master Guide
            ),
            TeamMember(
                team_id=teams[1].team_id,
                user_id=users[3].user_id,
                role_level=4  # Base Guide
            )
        ]
        
        for member in team_members:
            db.session.add(member)
        
        # Set up team role configurations
        for team in teams:
            config = TeamRoleConfiguration(
                team_id=team.team_id,
                level_1_name="Master Guide",
                level_2_name="Tactical Guide",
                level_3_name="Technical Guide",
                level_4_name="Base Guide"
            )
            db.session.add(config)
        
        db.session.commit()
        print("Sample data created successfully!")

if __name__ == '__main__':
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Initialize the outdooer database')
    parser.add_argument('--sample-data', action='store_true', help='Add sample data for development/testing')
    parser.add_argument('--reset', action='store_true', help='Drop all tables and recreate (destroys existing data)')
    args = parser.parse_args()
    
    # Create Flask app
    app = create_app(os.getenv('FLASK_ENV', 'development'))
    
    # Initialize database
    init_db(app, sample_data=args.sample_data, reset=args.reset)